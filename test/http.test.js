import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpError, requestJson } from '../src/http.js';
import { JiraClient } from '../src/jiraClient.js';
import { GitlabClient } from '../src/gitlabClient.js';

/** Fake fetch that returns the queued responses in order and records the calls. */
function fakeFetch(...responses) {
    const calls = [];
    const fetchImpl = async (url, init) => {
        calls.push({ url, init });
        const next = responses.shift();
        if (next instanceof Error) {
            throw next;
        }
        return new Response(next.body === undefined ? '' : JSON.stringify(next.body), { status: next.status ?? 200, headers: next.headers });
    };
    return { fetchImpl, calls };
}

test('returns parsed JSON', async () => {
    const { fetchImpl } = fakeFetch({ body: { ok: 1 } });
    assert.deepEqual(await requestJson('https://x.example.org', { fetchImpl }), { ok: 1 });
});

test('retries once on 429, honoring Retry-After', async () => {
    const { fetchImpl, calls } = fakeFetch({ status: 429, headers: { 'Retry-After': '0' } }, { body: { ok: 1 } });
    assert.deepEqual(await requestJson('https://x.example.org', { fetchImpl }), { ok: 1 });
    assert.equal(calls.length, 2);
});

test('retries once on a network error', async () => {
    const { fetchImpl, calls } = fakeFetch(new TypeError('fetch failed'), { body: [] });
    assert.deepEqual(await requestJson('https://x.example.org', { fetchImpl }), []);
    assert.equal(calls.length, 2);
});

test('names the cause of a network error', async () => {
    const error = () => new TypeError('fetch failed', { cause: Object.assign(new Error('unable to verify'), { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' }) });
    const { fetchImpl } = fakeFetch(error(), error());
    await assert.rejects(requestJson('https://x.example.org', { fetchImpl, retries: 0 }), /fetch failed \(UNABLE_TO_VERIFY_LEAF_SIGNATURE\)/);
});

test('throws HttpError on a client error without retrying', async () => {
    const { fetchImpl, calls } = fakeFetch({ status: 401, body: { message: 'nope' } });
    await assert.rejects(requestJson('https://x.example.org', { fetchImpl }), (error) => error instanceof HttpError && error.status === 401);
    assert.equal(calls.length, 1);
});

test('gives up after the retry', async () => {
    const { fetchImpl, calls } = fakeFetch({ status: 503, headers: { 'Retry-After': '0' } }, { status: 503 });
    await assert.rejects(requestJson('https://x.example.org', { fetchImpl }), (error) => error.status === 503);
    assert.equal(calls.length, 2);
});

test('jira client posts to the v3 remote link API with basic auth', async () => {
    const { fetchImpl, calls } = fakeFetch({ status: 201, body: { id: 1 } });
    const jira = new JiraClient({ baseUrl: 'https://example.atlassian.net', email: 'bot@example.org', apiToken: 'tok', timeoutMs: 1000, fetchImpl });

    assert.equal(await jira.upsertRemoteLink('TEST-1', { globalId: 'g' }), true);
    assert.equal(calls[0].url, 'https://example.atlassian.net/rest/api/3/issue/TEST-1/remotelink');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers.Authorization, 'Basic ' + Buffer.from('bot@example.org:tok').toString('base64'));
    assert.equal(calls[0].init.body, '{"globalId":"g"}');
});

test('jira client reports an unknown issue as false', async () => {
    const { fetchImpl } = fakeFetch({ status: 404, body: { errorMessages: ['Issue does not exist'] } });
    const jira = new JiraClient({ baseUrl: 'https://example.atlassian.net', email: 'e', apiToken: 't', timeoutMs: 1000, fetchImpl });
    assert.equal(await jira.upsertRemoteLink('UTF-8', {}), false);
});

test('gitlab client sends the private token and encodes path parts', async () => {
    const { fetchImpl, calls } = fakeFetch({ body: {} });
    const gitlab = new GitlabClient({ baseUrl: 'https://git.example.org', token: 'glpat', timeoutMs: 1000, fetchImpl });
    await gitlab.getMergeRequest('group/project', 6);
    assert.equal(calls[0].url, 'https://git.example.org/api/v4/projects/group%2Fproject/merge_requests/6');
    assert.equal(calls[0].init.headers['PRIVATE-TOKEN'], 'glpat');
});
