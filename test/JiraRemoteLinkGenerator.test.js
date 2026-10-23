import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { buildRemoteLink, formatDate, loadIconUrls } from '../src/JiraRemoteLinkGenerator.js';

const ICON_BASE = 'https://raw.githubusercontent.com/webdog/octicons-png/master/black/';
const iconUrls = loadIconUrls();
const options = { iconUrls, timeZone: 'UTC' };

const baseEvent = () => ({
    type: 'merge_request',
    shortcut: '!3',
    targetProjectId: 1422,
    targetPath: 'example/jira-test',
    targetUrl: 'https://git.example.org/example/jira-test',
    targetBranch: 'main',
    sourceBranch: 'feature/TEST-12345-open-test',
    mergeTitle: 'Open MR',
    mergeStatus: 'unchecked',
    mergeId: 10841,
    mergeState: 'opened',
    isDraft: false,
    updatedAt: '2018-09-16T06:50:00Z',
    mergeUrl: 'https://git.example.org/example/jira-test/-/merge_requests/3',
});

const MR_URL = 'https://git.example.org/example/jira-test/-/merge_requests/3';
const PIPELINE_URL = 'https://git.example.org/example/jira-test/-/pipelines/38537';

test('builds the full remote link of an open merge request', () => {
    assert.deepEqual(buildRemoteLink(baseEvent(), options), {
        globalId: 'gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10841',
        application: { type: 'com.gitlab', name: 'Gitlab' },
        relationship: 'example/jira-test',
        object: {
            url: MR_URL,
            title: '!3 Open MR',
            summary: '2018/09/16 06:50',
            icon: { url16x16: ICON_BASE + 'git-pull-request.png', title: 'Open Merge Request' },
            status: {
                resolved: false,
                icon: { url16x16: ICON_BASE + 'clock.png', title: 'Unchecked', link: MR_URL },
            },
        },
    });
});

const cases = [
    {
        name: 'merged',
        event: { mergeState: 'merged', mergeStatus: 'not_open' },
        object: ['git-merge.png', 'Merged Merge Request'],
        status: ['git-merge.png', 'Merged Merge Request', MR_URL],
        resolved: true,
    },
    {
        name: 'closed',
        event: { mergeState: 'closed', mergeStatus: 'not_open', pipelineStatus: 'failed', pipelineUrl: PIPELINE_URL },
        object: ['circle-slash.png', 'Canceled Merge Request'],
        status: ['circle-slash.png', 'Canceled Merge Request', MR_URL],
        resolved: true,
    },
    {
        name: 'locked',
        event: { mergeState: 'locked', mergeStatus: 'mergeable' },
        object: ['lock.png', 'Locked Merge Request'],
        status: ['checklist.png', 'Can be merged', MR_URL],
        resolved: false,
    },
    { name: 'mergeable', event: { mergeStatus: 'mergeable' }, status: ['checklist.png', 'Can be merged', MR_URL] },
    { name: 'conflict', event: { mergeStatus: 'conflict' }, status: ['alert.png', 'Has conflicts', MR_URL] },
    { name: 'need rebase', event: { mergeStatus: 'need_rebase' }, status: ['sync.png', 'Needs rebase', MR_URL] },
    { name: 'draft', event: { mergeStatus: 'draft_status', isDraft: true }, status: ['pencil.png', 'Draft', MR_URL] },
    { name: 'not approved', event: { mergeStatus: 'not_approved' }, status: ['eye.png', 'Awaiting approval', MR_URL] },
    { name: 'discussions', event: { mergeStatus: 'discussions_not_resolved' }, status: ['comment-discussion.png', 'Unresolved discussions', MR_URL] },
    { name: 'unknown status', event: { mergeStatus: 'jira_association_missing' }, status: ['shield.png', 'Blocked: jira association missing', MR_URL] },
    {
        name: 'failed pipeline',
        event: { pipelineStatus: 'failed', pipelineUrl: PIPELINE_URL },
        status: ['stop.png', 'Pipeline failed', PIPELINE_URL],
    },
    {
        name: 'pending pipeline',
        event: { pipelineStatus: 'pending', pipelineUrl: PIPELINE_URL },
        status: ['clock.png', 'Pipeline pending', PIPELINE_URL],
    },
    {
        name: 'running pipeline',
        event: { pipelineStatus: 'running', pipelineUrl: PIPELINE_URL },
        status: ['server.png', 'Pipeline running', PIPELINE_URL],
    },
    {
        name: 'canceled pipeline',
        event: { pipelineStatus: 'canceled', pipelineUrl: PIPELINE_URL },
        status: ['x.png', 'Pipeline canceled', PIPELINE_URL],
    },
    {
        name: 'successful pipeline shows the merge status',
        event: { mergeStatus: 'mergeable', pipelineStatus: 'success', pipelineUrl: PIPELINE_URL },
        status: ['checklist.png', 'Can be merged', MR_URL],
    },
];

for (const { name, event, object = ['git-pull-request.png', 'Open Merge Request'], status, resolved = false } of cases) {
    test(`maps ${name}`, () => {
        const link = buildRemoteLink({ ...baseEvent(), ...event }, options);
        assert.deepEqual(link.object.icon, { url16x16: ICON_BASE + object[0], title: object[1] });
        assert.deepEqual(link.object.status, {
            resolved,
            icon: { url16x16: ICON_BASE + status[0], title: status[1], link: status[2] },
        });
    });
}

test('every icon key used by the mappings exists in the bundled map', () => {
    for (const { event } of cases) {
        const link = buildRemoteLink({ ...baseEvent(), ...event }, options);
        assert.ok(link.object.icon.url16x16, `object icon for ${JSON.stringify(event)}`);
        assert.ok(link.object.status.icon.url16x16, `status icon for ${JSON.stringify(event)}`);
    }
});

test('a custom icon map overrides only the keys it contains', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'icons-'));
    const file = path.join(dir, 'icons.json');
    writeFileSync(file, JSON.stringify({ merged: 'https://icons.example.org/merged.png' }));
    const custom = loadIconUrls(file);
    assert.equal(custom.merged, 'https://icons.example.org/merged.png');
    assert.equal(custom.default, iconUrls.default);
});

test('formats dates from the REST API and from webhooks', () => {
    assert.equal(formatDate('2018-09-16T14:25:48.937Z', 'UTC'), '2018/09/16 14:25');
    assert.equal(formatDate('2018-09-16 07:21:38 UTC', 'UTC'), '2018/09/16 07:21');
    assert.equal(formatDate('2018-09-16T23:30:00Z', 'Europe/Amsterdam'), '2018/09/17 01:30');
    assert.equal(formatDate('not a date', 'UTC'), '');
});
