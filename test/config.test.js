import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConfigError, loadConfig } from '../src/config.js';

const env = () => ({
    GITLAB_BASE_URL: 'https://git.example.org/',
    GITLAB_TOKEN: 'glpat-x',
    GITLAB_WEBHOOK_TOKEN: 'secret',
    JIRA_BASE_URL: 'https://example.atlassian.net',
    JIRA_EMAIL: 'bot@example.org',
    JIRA_API_TOKEN: 'jira-token',
});

test('reads a complete configuration', () => {
    const { config, warnings } = loadConfig({ ...env(), JIRA_PROJECT_KEYS: 'test, ops ,', PORT: '8080' });
    assert.deepEqual(warnings, []);
    assert.equal(config.port, 8080);
    assert.equal(config.gitlab.baseUrl, 'https://git.example.org');
    assert.deepEqual(config.jira.projectKeys, ['TEST', 'OPS']);
    assert.equal(config.requestTimeoutMs, 10000);
    assert.equal(config.storeEventsDir, undefined);
});

test('lists every missing variable', () => {
    assert.throws(
        () => loadConfig({ GITLAB_BASE_URL: 'https://git.example.org' }),
        (error) => error instanceof ConfigError
            && /GITLAB_TOKEN, GITLAB_WEBHOOK_TOKEN, JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN/.test(error.message),
    );
});

test('rejects invalid URLs and numbers', () => {
    assert.throws(() => loadConfig({ ...env(), JIRA_BASE_URL: 'example.atlassian.net' }), ConfigError);
    assert.throws(() => loadConfig({ ...env(), GITLAB_BASE_URL: 'ftp://git.example.org' }), ConfigError);
    assert.throws(() => loadConfig({ ...env(), PORT: 'abc' }), ConfigError);
});

test('accepts the 1.x variable names with warnings', () => {
    const { config, warnings } = loadConfig({
        GITLAB_BASE_URL: 'https://git.example.org',
        GITLAB_PERSONAL_ACCESS_TOKEN: 'old-gitlab',
        GITLAB_WEBHOOK_TOKEN: 'secret',
        JIRA_BASE_URL: 'https://example.atlassian.net',
        JIRA_USERNAME: 'bot@example.org',
        JIRA_PASSWORD: 'old-jira',
        JIRA_HTTPS_PROXY: 'http://proxy:3128',
        ICON_URL_PATH: '/config/',
        STORE_EVENTS: '1',
    });
    assert.equal(config.gitlab.token, 'old-gitlab');
    assert.equal(config.jira.email, 'bot@example.org');
    assert.equal(config.jira.apiToken, 'old-jira');
    assert.match(config.iconUrlMapPath, /config[\\/]icon-url-map\.json$/);
    assert.equal(config.storeEventsDir, 'data');
    assert.equal(warnings.length, 6);
});
