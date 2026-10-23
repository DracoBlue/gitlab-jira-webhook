import { requestJson } from './http.js';

export class GitlabClient {
    constructor({ baseUrl, token, timeoutMs, fetchImpl }) {
        this.baseUrl = baseUrl;
        this.token = token;
        this.timeoutMs = timeoutMs;
        this.fetchImpl = fetchImpl;
    }

    #get(path) {
        return requestJson(`${this.baseUrl}/api/v4${path}`, {
            headers: { 'PRIVATE-TOKEN': this.token },
            timeoutMs: this.timeoutMs,
            fetchImpl: this.fetchImpl,
        });
    }

    getCurrentUser() {
        return this.#get('/user');
    }

    getMergeRequest(projectId, iid) {
        return this.#get(`/projects/${encodeURIComponent(projectId)}/merge_requests/${encodeURIComponent(iid)}`);
    }

    getMergeRequestsForCommit(projectId, sha) {
        return this.#get(`/projects/${encodeURIComponent(projectId)}/repository/commits/${encodeURIComponent(sha)}/merge_requests`);
    }
}
