import { HttpError, requestJson } from './http.js';

export class JiraClient {
    constructor({ baseUrl, email, apiToken, timeoutMs, fetchImpl }) {
        this.baseUrl = baseUrl;
        this.authorization = 'Basic ' + Buffer.from(`${email}:${apiToken}`).toString('base64');
        this.timeoutMs = timeoutMs;
        this.fetchImpl = fetchImpl;
    }

    getMyself() {
        return requestJson(`${this.baseUrl}/rest/api/3/myself`, {
            headers: { Authorization: this.authorization },
            timeoutMs: this.timeoutMs,
            fetchImpl: this.fetchImpl,
        });
    }

    /**
     * Creates the remote link, or updates the existing one with the same globalId.
     *
     * @returns {Promise<boolean>} false when the issue does not exist or is not visible to the Jira user
     */
    async upsertRemoteLink(issueKey, remoteLink) {
        try {
            await requestJson(`${this.baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}/remotelink`, {
                method: 'POST',
                headers: { Authorization: this.authorization },
                body: remoteLink,
                timeoutMs: this.timeoutMs,
                fetchImpl: this.fetchImpl,
            });
            return true;
        } catch (error) {
            if (error instanceof HttpError && error.status === 404) {
                return false;
            }
            throw error;
        }
    }
}
