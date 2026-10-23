import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';
import { setLogLevel } from '../src/log.js';

const TOKEN = 'webhook-secret';
const storeEventsDir = mkdtempSync(path.join(tmpdir(), 'events-'));
const enqueued = [];
let server;
let baseUrl;

before(async () => {
    setLogLevel('silent');
    const app = createApp({
        webhookToken: TOKEN,
        processor: { enqueue: (payload) => enqueued.push(payload) },
        appVersion: '9.9.9',
        storeEventsDir,
    });
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const post = (body, token = TOKEN) => fetch(`${baseUrl}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Gitlab-Token': token } : {}) },
    body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('GET / answers OK with version headers', async () => {
    const response = await fetch(baseUrl + '/');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'OK');
    assert.equal(response.headers.get('x-app-version'), '9.9.9');
    assert.equal(response.headers.get('x-powered-by'), null);
});

test('rejects a wrong or missing token', async () => {
    const before = enqueued.length;
    assert.equal((await post({ object_kind: 'merge_request' }, 'wrong')).status, 403);
    assert.equal((await post({ object_kind: 'merge_request' }, null)).status, 403);
    assert.equal(enqueued.length, before);
});

test('accepts and enqueues supported events', async () => {
    const response = await post({ object_kind: 'merge_request', object_attributes: { iid: 1 } });
    assert.equal(response.status, 200);
    assert.equal(enqueued.at(-1).object_kind, 'merge_request');
});

test('acknowledges but ignores other events', async () => {
    const before = enqueued.length;
    assert.equal((await post({ object_kind: 'push' })).status, 200);
    assert.equal(enqueued.length, before);
});

test('answers 400 to malformed JSON', async () => {
    assert.equal((await post('{not json')).status, 400);
});

test('stores events with a sanitized file name', async () => {
    await post({ object_kind: '../../etc/evil' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const files = readdirSync(storeEventsDir);
    assert.ok(files.some((file) => /^unknown\.\d+\.json$/.test(file)), files.join(', '));
    assert.ok(files.every((file) => !file.includes('..')));
});
