import { parseMergeRequest } from './GitlabEventParser.js';
import { buildRemoteLink } from './JiraRemoteLinkGenerator.js';
import { extractIssueKeys } from './JiraTicketExtractor.js';
import { log } from './log.js';

export const SUPPORTED_EVENTS = new Set(['merge_request', 'pipeline']);

/**
 * Handles GitLab webhook payloads: finds the merge requests they concern, re-reads each one
 * from the API (webhook payloads lack the pipeline status) and upserts a remote link on every
 * Jira issue the merge request mentions.
 */
export class EventProcessor {
    constructor({ gitlab, jira, iconUrls, projectKeys = [], timeZone }) {
        this.gitlab = gitlab;
        this.jira = jira;
        this.iconUrls = iconUrls;
        this.projectKeys = projectKeys;
        this.timeZone = timeZone;
        this.pending = new Set();
    }

    /** Starts handling the payload in the background; errors are logged, never thrown. */
    enqueue(payload) {
        const task = this.handle(payload)
            .catch((error) => log.error('event processing failed', { kind: payload.object_kind, error: error.message }))
            .finally(() => this.pending.delete(task));
        this.pending.add(task);
        return task;
    }

    /** Waits for background work to finish, for graceful shutdown. */
    async drain() {
        await Promise.allSettled([...this.pending]);
    }

    async handle(payload) {
        const refs = await this.#mergeRequestRefs(payload);
        const unique = new Map(refs.map((ref) => [`${ref.projectId}!${ref.iid}`, ref]));
        const results = await Promise.allSettled(
            [...unique.values()].map((ref) => this.#syncMergeRequest(ref, payload.project)),
        );
        for (const result of results) {
            if (result.status === 'rejected') {
                log.error('merge request sync failed', { kind: payload.object_kind, error: result.reason.message });
            }
        }
        return results.filter((result) => result.status === 'fulfilled').map((result) => result.value);
    }

    async #mergeRequestRefs(payload) {
        if (payload.object_kind === 'merge_request') {
            const attributes = payload.object_attributes ?? {};
            return [{ projectId: attributes.target_project_id ?? payload.project?.id, iid: attributes.iid }];
        }

        if (payload.object_kind === 'pipeline') {
            // Merge request pipelines name their merge request; branch pipelines need a lookup by commit.
            if (payload.merge_request?.iid) {
                const mergeRequest = payload.merge_request;
                return [{ projectId: mergeRequest.target_project_id ?? payload.project?.id, iid: mergeRequest.iid }];
            }
            const sha = payload.object_attributes?.sha ?? payload.commit?.id;
            if (!payload.project?.id || !sha) {
                return [];
            }
            const mergeRequests = await this.gitlab.getMergeRequestsForCommit(payload.project.id, sha);
            return mergeRequests.map((mergeRequest) => ({ projectId: mergeRequest.project_id, iid: mergeRequest.iid }));
        }

        return [];
    }

    async #syncMergeRequest({ projectId, iid }, payloadProject) {
        const mergeRequest = await this.gitlab.getMergeRequest(projectId, iid);
        const targetProject = payloadProject?.id === mergeRequest.project_id ? payloadProject : undefined;
        const event = parseMergeRequest(mergeRequest, targetProject);
        const issueKeys = extractIssueKeys(event, { projectKeys: this.projectKeys });
        const result = { mergeRequest: `${event.targetPath}${event.shortcut}`, linked: [], notFound: [], failed: [] };
        if (issueKeys.length === 0) {
            log.debug('no issue keys in merge request', { mergeRequest: result.mergeRequest });
            return result;
        }

        const remoteLink = buildRemoteLink(event, { iconUrls: this.iconUrls, timeZone: this.timeZone });
        await Promise.all(issueKeys.map(async (issueKey) => {
            try {
                if (await this.jira.upsertRemoteLink(issueKey, remoteLink)) {
                    result.linked.push(issueKey);
                } else {
                    result.notFound.push(issueKey);
                }
            } catch (error) {
                result.failed.push(issueKey);
                log.error('jira update failed', { mergeRequest: result.mergeRequest, issueKey, error: error.message });
            }
        }));

        log.info('merge request synced', result);
        return result;
    }
}
