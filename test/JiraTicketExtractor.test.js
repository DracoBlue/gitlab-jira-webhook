import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extractIssueKeys } from '../src/JiraTicketExtractor.js';

const event = (sourceBranch, mergeTitle, mergeDescription) => ({ sourceBranch, mergeTitle, mergeDescription });

test('finds nothing without issue keys', () => {
    assert.deepEqual(extractIssueKeys(event('feature/we-did-things', 'We did things', 'There has been lots of things to do.')), []);
});

test('finds a key in the source branch', () => {
    assert.deepEqual(extractIssueKeys(event('feature/TEST-123-we-did-things', 'We did things', '')), ['TEST-123']);
});

test('finds keys in the title', () => {
    assert.deepEqual(extractIssueKeys(event('finally-fix-fix', 'Finally fix TEST-123 and TEST-125', '')), ['TEST-123', 'TEST-125']);
});

test('finds keys in the description', () => {
    assert.deepEqual(
        extractIssueKeys(event('finally-fix-fix', 'Finally fix', 'There has been work for TEST-123 and TEST-125 to do.')),
        ['TEST-123', 'TEST-125'],
    );
});

test('returns unique keys in order of appearance', () => {
    assert.deepEqual(
        extractIssueKeys(event('finally-TEST-555-fix-fix', 'Finally fix TEST-666', 'There has TEST-555 been work for TEST-123 and TEST-125 to do.')),
        ['TEST-555', 'TEST-666', 'TEST-123', 'TEST-125'],
    );
});

test('handles a missing description', () => {
    assert.deepEqual(extractIssueKeys(event('main', 'Fix TEST-1', null)), ['TEST-1']);
});

test('accepts digits and underscores in the project key', () => {
    assert.deepEqual(extractIssueKeys(event('', 'Fix AB2-7 and MY_PROJ-8', '')), ['AB2-7', 'MY_PROJ-8']);
});

test('does not match inside longer words or numbers', () => {
    assert.deepEqual(extractIssueKeys(event('', 'xTEST-1 TEST-12a TEST-3', 'see A-1 and 9TEST-4')), ['TEST-12', 'TEST-3']);
});

test('keeps only the configured project keys', () => {
    assert.deepEqual(
        extractIssueKeys(event('', 'Switch to UTF-8 for TEST-1 and OPS-2', ''), { projectKeys: ['TEST', 'OPS'] }),
        ['TEST-1', 'OPS-2'],
    );
});
