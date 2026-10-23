import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, test } from 'node:test';
import { loadIconUrls } from '../src/JiraRemoteLinkGenerator.js';
import { setLogLevel } from '../src/log.js';
import { EventProcessor } from '../src/processor.js';

before(() => setLogLevel('silent'));

const mergeRequest = (overrides = {}) => ({
    ...JSON.parse(readFileSync(new URL('./fixtures/merge-request.json', import.meta.url), 'utf8')),
    ...overrides,
});

/** Fake GitLab and Jira clients that record what the processor asks for. */
function setup({ mergeRequests = { '1422!6': mergeRequest() }, commitMergeRequests = [], jiraResult = () => true } = {}) {
    const calls = { getMergeRequest: [], getMergeRequestsForCommit: [], upsert: [] };
    const gitlab = {
        async getMergeRequest(projectId, iid) {
            calls.getMergeRequest.push(`${projectId}!${iid}`);
            const found = mergeRequests[`${projectId}!${iid}`];
            if (!found) {
                throw new Error(`no merge request ${projectId}!${iid}`);
            }
            return found;
        },
        async getMergeRequestsForCommit(projectId, sha) {
            calls.getMergeRequestsForCommit.push(`${projectId}@${sha}`);
            return commitMergeRequests;
        },
    };
    const jira = {
        async upsertRemoteLink(issueKey, link) {
            calls.upsert.push({ issueKey, link });
            return jiraResult(issueKey);
        },
    };
    const processor = new EventProcessor({ gitlab, jira, iconUrls: loadIconUrls(), timeZone: 'UTC' });
    return { processor, calls };
}

const mergeRequestEvent = { object_kind: 'merge_request', project: { id: 1422 }, object_attributes: { iid: 6, target_project_id: 1422 } };

test('merge request event: refetches the merge request and links every mentioned issue', async () => {
    const { processor, calls } = setup({
        mergeRequests: { '1422!6': mergeRequest({ title: 'TEST-1 and OPS-2' }) },
    });
    const [result] = await processor.handle(mergeRequestEvent);

    assert.deepEqual(calls.getMergeRequest, ['1422!6']);
    assert.deepEqual(calls.upsert.map((call) => call.issueKey), ['TEST-12345', 'TEST-1', 'OPS-2']);
    assert.equal(calls.upsert[0].link.object.url, 'https://git.example.org/example/jira-test/-/merge_requests/6');
    assert.deepEqual(result.linked.sort(), ['OPS-2', 'TEST-1', 'TEST-12345']);
});

test('pipeline event of a merge request pipeline uses the merge request from the payload', async () => {
    const { processor, calls } = setup();
    await processor.handle({
        object_kind: 'pipeline',
        project: { id: 1422 },
        object_attributes: { sha: 'abc' },
        merge_request: { iid: 6, target_project_id: 1422 },
    });
    assert.deepEqual(calls.getMergeRequestsForCommit, []);
    assert.deepEqual(calls.getMergeRequest, ['1422!6']);
});

test('pipeline event of a branch pipeline looks merge requests up by commit and dedupes them', async () => {
    const { processor, calls } = setup({
        commitMergeRequests: [{ project_id: 1422, iid: 6 }, { project_id: 1422, iid: 6 }],
    });
    await processor.handle({ object_kind: 'pipeline', project: { id: 1422 }, object_attributes: { sha: 'abc' }, merge_request: null });
    assert.deepEqual(calls.getMergeRequestsForCommit, ['1422@abc']);
    assert.deepEqual(calls.getMergeRequest, ['1422!6']);
});

test('unknown issues and Jira errors are reported but do not stop other issues', async () => {
    const { processor } = setup({
        mergeRequests: { '1422!6': mergeRequest({ title: 'UTF-8 for TEST-1 and BAD-1' }) },
        jiraResult: (key) => {
            if (key === 'BAD-1') {
                throw new Error('HTTP 500');
            }
            return key !== 'UTF-8';
        },
    });
    const [result] = await processor.handle(mergeRequestEvent);
    assert.deepEqual(result.linked.sort(), ['TEST-1', 'TEST-12345']);
    assert.deepEqual(result.notFound, ['UTF-8']);
    assert.deepEqual(result.failed, ['BAD-1']);
});

test('a failing GitLab lookup is contained', async () => {
    const { processor } = setup({ mergeRequests: {} });
    assert.deepEqual(await processor.handle(mergeRequestEvent), []);
});

test('enqueue never rejects and drain waits for pending work', async () => {
    const { processor } = setup();
    processor.handle = async () => {
        throw new Error('boom');
    };
    processor.enqueue(mergeRequestEvent);
    assert.equal(processor.pending.size, 1);
    await processor.drain();
    assert.equal(processor.pending.size, 0);
});

test('merge requests without issue keys are skipped', async () => {
    const { processor, calls } = setup({
        mergeRequests: { '1422!6': mergeRequest({ title: 'chore', description: '', source_branch: 'chore' }) },
    });
    await processor.handle(mergeRequestEvent);
    assert.equal(calls.upsert.length, 0);
});
