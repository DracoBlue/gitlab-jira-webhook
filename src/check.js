// Verifies the configuration and that GitLab and Jira accept the credentials.
// Usage: node src/check.js   (exit code 0 = all good)
import { existsSync } from 'node:fs';
import { loadConfig } from './config.js';
import { GitlabClient } from './gitlabClient.js';
import { JiraClient } from './jiraClient.js';
import { loadIconUrls } from './JiraRemoteLinkGenerator.js';

if (existsSync('.env')) {
    process.loadEnvFile('.env');
}

let failed = false;
const report = (ok, message) => {
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${message}`);
    failed ||= !ok;
};

async function check(name, action) {
    try {
        report(true, `${name}: ${await action()}`);
    } catch (error) {
        report(false, `${name}: ${error.message}`);
    }
}

let config;
try {
    ({ config } = loadConfig());
    report(true, 'configuration');
} catch (error) {
    report(false, `configuration: ${error.message}`);
    process.exit(1);
}

await check('icon map', async () => `${Object.keys(loadIconUrls(config.iconUrlMapPath)).length} icons`);

const gitlab = new GitlabClient({ ...config.gitlab, timeoutMs: config.requestTimeoutMs });
await check(`GitLab ${config.gitlab.baseUrl}`, async () => {
    const user = await gitlab.getCurrentUser();
    return `authenticated as ${user.username}`;
});

const jira = new JiraClient({ ...config.jira, timeoutMs: config.requestTimeoutMs });
await check(`Jira ${config.jira.baseUrl}`, async () => {
    const myself = await jira.getMyself();
    return `authenticated as ${myself.displayName ?? myself.accountId}`;
});

process.exit(failed ? 1 : 0);
