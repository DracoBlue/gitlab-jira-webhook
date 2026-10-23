export class HttpError extends Error {
    constructor(method, url, status, body) {
        super(`${method} ${url} failed with HTTP ${status}${body ? `: ${body}` : ''}`);
        this.name = 'HttpError';
        this.status = status;
    }
}

const MAX_RETRY_DELAY_MS = 30_000;

function retryDelayMs(response, attempt) {
    const retryAfter = response?.headers.get('retry-after');
    if (retryAfter) {
        const seconds = Number(retryAfter);
        const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
        if (Number.isFinite(delay)) {
            return Math.min(Math.max(delay, 0), MAX_RETRY_DELAY_MS);
        }
    }
    return Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * fetch() wrapper: JSON in/out, timeout, and retries on network errors, 429 and 5xx.
 * Throws HttpError for any other non-2xx response.
 */
export async function requestJson(url, { method = 'GET', headers = {}, body, timeoutMs = 10000, retries = 1, fetchImpl = fetch } = {}) {
    const init = {
        method,
        headers: { Accept: 'application/json', ...headers },
    };
    if (body !== undefined) {
        init.headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
    }

    for (let attempt = 0; ; attempt++) {
        let response;
        try {
            response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
        } catch (error) {
            if (attempt < retries) {
                await sleep(retryDelayMs(undefined, attempt));
                continue;
            }
            // fetch() reports TLS, DNS and connection problems as "fetch failed"; the cause says which.
            const reason = error.cause?.code ?? error.cause?.message;
            throw new Error(`${method} ${url} failed: ${error.message}${reason ? ` (${reason})` : ''}`, { cause: error });
        }

        const text = await response.text();
        if (response.ok) {
            return text ? JSON.parse(text) : null;
        }
        if ((response.status === 429 || response.status >= 500) && attempt < retries) {
            await sleep(retryDelayMs(response, attempt));
            continue;
        }
        throw new HttpError(method, url, response.status, text.slice(0, 500));
    }
}
