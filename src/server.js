import { existsSync } from 'node:fs';
import { createApp } from './app.js';
import { ConfigError, loadConfig } from './config.js';
import { GitlabClient } from './gitlabClient.js';
import { JiraClient } from './jiraClient.js';
import { loadIconUrls } from './JiraRemoteLinkGenerator.js';
import { log, setLogLevel } from './log.js';
import { EventProcessor } from './processor.js';

if (existsSync('.env')) {
    process.loadEnvFile('.env');
}

let loaded;
try {
    loaded = loadConfig();
} catch (error) {
    if (error instanceof ConfigError) {
        log.error(error.message);
        process.exit(1);
    }
    throw error;
}
const { config, warnings } = loaded;
setLogLevel(config.logLevel);
warnings.forEach((warning) => log.warn(warning));

const processor = new EventProcessor({
    gitlab: new GitlabClient({ ...config.gitlab, timeoutMs: config.requestTimeoutMs }),
    jira: new JiraClient({ ...config.jira, timeoutMs: config.requestTimeoutMs }),
    iconUrls: loadIconUrls(config.iconUrlMapPath),
    projectKeys: config.jira.projectKeys,
});

const app = createApp({
    webhookToken: config.webhookToken,
    processor,
    appVersion: config.appVersion,
    storeEventsDir: config.storeEventsDir,
});

const server = app.listen(config.port, () => {
    log.info('listening', { port: config.port, version: config.appVersion ?? 'dev' });
});

const SHUTDOWN_TIMEOUT_MS = 15_000;

function shutdown(signal) {
    log.info('shutting down', { signal, pending: processor.pending.size });
    setTimeout(() => {
        log.warn('shutdown timed out, exiting with work still pending', { pending: processor.pending.size });
        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
    server.close();
    processor.drain().then(() => process.exit(0));
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
