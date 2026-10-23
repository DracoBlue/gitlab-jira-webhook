import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { log } from './log.js';
import { SUPPORTED_EVENTS } from './processor.js';

function tokenMatches(received, expected) {
    if (typeof received !== 'string') {
        return false;
    }
    // Hashing first gives equal-length buffers, so the comparison time doesn't depend on the token.
    const digest = (value) => createHash('sha256').update(value).digest();
    return timingSafeEqual(digest(received), digest(expected));
}

async function storeEvent(dir, payload) {
    const kind = /^[a-z_]{1,64}$/.test(payload?.object_kind) ? payload.object_kind : 'unknown';
    const file = path.join(dir, `${kind}.${Date.now()}.json`);
    try {
        await mkdir(dir, { recursive: true });
        await writeFile(file, JSON.stringify(payload, null, 2));
        log.debug('stored event', { file });
    } catch (error) {
        log.warn('could not store event', { file, error: error.message });
    }
}

/**
 * @param {{ webhookToken: string, processor: { enqueue(payload: object): unknown }, appVersion?: string, storeEventsDir?: string }} options
 */
export function createApp({ webhookToken, processor, appVersion, storeEventsDir }) {
    const app = express();
    app.disable('x-powered-by');

    app.use((req, res, next) => {
        res.set('X-App-Name', 'gitlab-jira-webhook');
        if (appVersion) {
            res.set('X-App-Version', appVersion);
        }
        next();
    });

    app.get('/', (req, res) => {
        res.send('OK');
    });

    app.post(
        '/events',
        (req, res, next) => {
            // Check the token before parsing the body.
            if (!tokenMatches(req.get('X-Gitlab-Token'), webhookToken)) {
                log.warn('rejected webhook call with invalid token', { ip: req.ip });
                res.sendStatus(403);
                return;
            }
            next();
        },
        express.json({ limit: '5mb' }),
        (req, res) => {
            const payload = req.body ?? {};
            // Answer right away: GitLab times out slow hooks and eventually disables them.
            res.send('OK');

            if (storeEventsDir) {
                storeEvent(storeEventsDir, payload);
            }
            if (!SUPPORTED_EVENTS.has(payload.object_kind)) {
                log.debug('ignoring event', { kind: payload.object_kind });
                return;
            }
            processor.enqueue(payload);
        },
    );

    // Malformed JSON and other request errors: answer without a stack trace.
    app.use((error, req, res, next) => {
        const status = error.status ?? error.statusCode ?? 500;
        if (status >= 500) {
            log.error('request failed', { error: error.message });
        }
        res.sendStatus(status);
    });

    return app;
}
