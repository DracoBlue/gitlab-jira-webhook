import path from 'node:path';

export class ConfigError extends Error {}

/**
 * Settings that were renamed. The old name still works but logs a warning.
 * [new name, old name]
 */
const ALIASES = [
    ['GITLAB_TOKEN', 'GITLAB_PERSONAL_ACCESS_TOKEN'],
    ['JIRA_EMAIL', 'JIRA_USERNAME'],
    ['JIRA_API_TOKEN', 'JIRA_PASSWORD'],
];

/** Settings from 1.x that no longer do anything, with the hint shown when they are set. */
const REMOVED = {
    JIRA_PFX_PATH: 'client certificates are not used by Jira Cloud',
    JIRA_PFX_PASSWORD: 'client certificates are not used by Jira Cloud',
    JIRA_HTTPS_PROXY: 'set HTTPS_PROXY and NODE_USE_ENV_PROXY=1 instead',
};

const REQUIRED = [
    'GITLAB_BASE_URL',
    'GITLAB_TOKEN',
    'GITLAB_WEBHOOK_TOKEN',
    'JIRA_BASE_URL',
    'JIRA_EMAIL',
    'JIRA_API_TOKEN',
];

function trimTrailingSlashes(value) {
    return value.replace(/\/+$/, '');
}

function parseUrl(name, value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new ConfigError(`${name} is not a valid URL: ${value}`);
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new ConfigError(`${name} must be an http(s) URL: ${value}`);
    }
    return trimTrailingSlashes(value);
}

function parsePositiveInt(name, value, fallback) {
    if (value === undefined || value === '') {
        return fallback;
    }
    const number = Number(value);
    if (!Number.isInteger(number) || number <= 0) {
        throw new ConfigError(`${name} must be a positive integer, got "${value}"`);
    }
    return number;
}

/**
 * Reads and validates the configuration from environment variables.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{ config: object, warnings: string[] }}
 */
export function loadConfig(env = process.env) {
    const warnings = [];
    const values = {};

    for (const [name, oldName] of ALIASES) {
        if (env[name]) {
            values[name] = env[name];
        } else if (env[oldName]) {
            values[name] = env[oldName];
            warnings.push(`${oldName} is deprecated, use ${name}`);
        }
    }
    for (const [name, hint] of Object.entries(REMOVED)) {
        if (env[name]) {
            warnings.push(`${name} is no longer supported and is ignored: ${hint}`);
        }
    }

    const get = (name) => values[name] ?? env[name];
    const missing = REQUIRED.filter((name) => !get(name));
    if (missing.length > 0) {
        throw new ConfigError(`Missing required environment variables: ${missing.join(', ')}`);
    }

    let iconUrlMapPath = env.ICON_URL_MAP_PATH;
    if (!iconUrlMapPath && env.ICON_URL_PATH) {
        iconUrlMapPath = path.join(env.ICON_URL_PATH, 'icon-url-map.json');
        warnings.push('ICON_URL_PATH is deprecated, set ICON_URL_MAP_PATH to the full path of the json file');
    }

    let storeEventsDir = env.STORE_EVENTS_DIR || undefined;
    if (!storeEventsDir && env.STORE_EVENTS) {
        storeEventsDir = 'data';
        warnings.push('STORE_EVENTS is deprecated, use STORE_EVENTS_DIR');
    }

    const projectKeys = (env.JIRA_PROJECT_KEYS ?? '')
        .split(',')
        .map((key) => key.trim().toUpperCase())
        .filter(Boolean);

    const config = {
        port: parsePositiveInt('PORT', env.PORT, 3000),
        logLevel: env.LOG_LEVEL || 'info',
        appVersion: env.APP_VERSION || undefined,
        webhookToken: get('GITLAB_WEBHOOK_TOKEN'),
        gitlab: {
            baseUrl: parseUrl('GITLAB_BASE_URL', get('GITLAB_BASE_URL')),
            token: get('GITLAB_TOKEN'),
        },
        jira: {
            baseUrl: parseUrl('JIRA_BASE_URL', get('JIRA_BASE_URL')),
            email: get('JIRA_EMAIL'),
            apiToken: get('JIRA_API_TOKEN'),
            projectKeys,
        },
        requestTimeoutMs: parsePositiveInt('REQUEST_TIMEOUT_MS', env.REQUEST_TIMEOUT_MS, 10000),
        iconUrlMapPath,
        storeEventsDir,
    };

    return { config, warnings };
}
