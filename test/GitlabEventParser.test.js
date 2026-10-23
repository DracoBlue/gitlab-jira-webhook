import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parseMergeRequest } from '../src/GitlabEventParser.js';

const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/merge-request.json', import.meta.url), 'utf8'));

test('parses a merge request from the REST API', () => {
    assert.deepEqual(parseMergeRequest(fixture()), {
        type: 'merge_request',
        shortcut: '!6',
        targetProjectId: 1422,
        targetPath: 'example/jira-test',
        targetUrl: 'https://git.example.org/example/jira-test',
        targetBranch: 'main',
        sourceBranch: 'feature/TEST-12345-added-other-test',
        mergeTitle: 'server test again',
        mergeDescription: 'Closes TEST-12345',
        mergeStatus: 'mergeable',
        mergeId: 10844,
        mergeState: 'opened',
        isDraft: false,
        updatedAt: '2018-09-16T14:25:48.937Z',
        mergeUrl: 'https://git.example.org/example/jira-test/-/merge_requests/6',
        pipelineId: 38537,
        pipelineStatus: 'success',
        pipelineUrl: 'https://git.example.org/example/jira-test/-/pipelines/38537',
    });
});

test('handles a project in a nested group', () => {
    const mergeRequest = fixture();
    mergeRequest.references.full = 'group/sub/jira-test!6';
    mergeRequest.web_url = 'https://git.example.org/group/sub/jira-test/-/merge_requests/6';
    const event = parseMergeRequest(mergeRequest);
    assert.equal(event.targetPath, 'group/sub/jira-test');
    assert.equal(event.targetUrl, 'https://git.example.org/group/sub/jira-test');
});

test('falls back to deprecated fields of older GitLab versions', () => {
    const mergeRequest = fixture();
    delete mergeRequest.detailed_merge_status;
    delete mergeRequest.draft;
    delete mergeRequest.references;
    delete mergeRequest.head_pipeline;
    mergeRequest.merge_status = 'cannot_be_merged';
    mergeRequest.work_in_progress = true;
    mergeRequest.web_url = 'https://git.example.org/example/jira-test/merge_requests/6';
    mergeRequest.pipeline = { id: 38052, status: 'failed' };

    const event = parseMergeRequest(mergeRequest, {
        path_with_namespace: 'example/jira-test',
        web_url: 'https://git.example.org/example/jira-test',
    });

    assert.equal(event.mergeStatus, 'conflict');
    assert.equal(event.isDraft, true);
    assert.equal(event.targetPath, 'example/jira-test');
    assert.equal(event.pipelineStatus, 'failed');
    assert.equal(event.pipelineUrl, 'https://git.example.org/example/jira-test/-/pipelines/38052');
});

test('leaves pipeline fields out when there is no pipeline', () => {
    const mergeRequest = fixture();
    mergeRequest.head_pipeline = null;
    const event = parseMergeRequest(mergeRequest);
    assert.equal('pipelineId' in event, false);
    assert.equal('pipelineUrl' in event, false);
});
