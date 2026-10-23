import { readFileSync } from 'node:fs';

const DEFAULT_ICON_URL_MAP = new URL('../icon-url-map.json', import.meta.url);

/**
 * Loads the icon map. A custom map only needs the keys it overrides;
 * the rest come from the bundled icon-url-map.json.
 */
export function loadIconUrls(customPath) {
    const icons = JSON.parse(readFileSync(DEFAULT_ICON_URL_MAP, 'utf8'));
    if (customPath) {
        Object.assign(icons, JSON.parse(readFileSync(customPath, 'utf8')));
    }
    return icons;
}

/** Merge request state -> [icon key, title] */
const MERGE_STATES = {
    opened: ['default', 'Open Merge Request'],
    locked: ['locked', 'Locked Merge Request'],
    closed: ['closed', 'Canceled Merge Request'],
    merged: ['merged', 'Merged Merge Request'],
};

/** Merge request `detailed_merge_status` -> [icon key, title] */
const MERGE_STATUSES = {
    mergeable: ['can_be_merged', 'Can be merged'],
    unchecked: ['unchecked', 'Unchecked'],
    checking: ['unchecked', 'Checking mergeability'],
    preparing: ['unchecked', 'Preparing'],
    approvals_syncing: ['unchecked', 'Syncing approvals'],
    conflict: ['cannot_be_merged', 'Has conflicts'],
    broken_status: ['cannot_be_merged', 'Cannot be merged'],
    need_rebase: ['need_rebase', 'Needs rebase'],
    draft_status: ['draft', 'Draft'],
    not_approved: ['needs_review', 'Awaiting approval'],
    requested_changes: ['needs_review', 'Changes requested'],
    discussions_not_resolved: ['discussions', 'Unresolved discussions'],
    ci_must_pass: ['pending', 'Pipeline must succeed'],
    ci_still_running: ['running', 'Pipeline still running'],
};

/**
 * Pipeline status -> [icon key, title]. Statuses not listed here (success, skipped)
 * fall through to the merge status, which says more once the pipeline is green.
 */
const PIPELINE_STATUSES = {
    created: ['pending', 'Pipeline pending'],
    waiting_for_resource: ['pending', 'Pipeline pending'],
    preparing: ['pending', 'Pipeline pending'],
    pending: ['pending', 'Pipeline pending'],
    scheduled: ['pending', 'Pipeline scheduled'],
    manual: ['pending', 'Pipeline waiting for manual action'],
    running: ['running', 'Pipeline running'],
    failed: ['failed', 'Pipeline failed'],
    canceling: ['canceled', 'Pipeline canceled'],
    canceled: ['canceled', 'Pipeline canceled'],
};

function humanize(status) {
    const text = String(status ?? 'unknown').replaceAll('_', ' ');
    return 'Blocked: ' + text;
}

/** Formats a timestamp as "YYYY/MM/DD HH:mm" in the given (or system) time zone. */
export function formatDate(value, timeZone) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(date).map((part) => [part.type, part.value]),
    );
    return `${parts.year}/${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}

function statusOf(event) {
    if (event.mergeState === 'merged' || event.mergeState === 'closed') {
        return [...MERGE_STATES[event.mergeState], event.mergeUrl];
    }
    const pipeline = event.pipelineUrl && PIPELINE_STATUSES[event.pipelineStatus];
    if (pipeline) {
        return [...pipeline, event.pipelineUrl];
    }
    const merge = MERGE_STATUSES[event.mergeStatus] ?? ['blocked', humanize(event.mergeStatus)];
    return [...merge, event.mergeUrl];
}

/**
 * Builds the Jira remote link object for a merge request event.
 * See https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-remote-links/
 *
 * @param {object} event result of parseMergeRequest()
 * @param {{ iconUrls: Record<string, string>, timeZone?: string }} options
 */
export function buildRemoteLink(event, { iconUrls, timeZone }) {
    const gitlabUrl = new URL(event.mergeUrl);
    gitlabUrl.pathname = '';
    gitlabUrl.search = '';
    gitlabUrl.hash = '';

    const [objectIcon, objectTitle] = MERGE_STATES[event.mergeState] ?? MERGE_STATES.opened;
    const [statusIcon, statusTitle, statusUrl] = statusOf(event);

    return {
        // Same format as 1.x, so links created by older versions get updated instead of duplicated.
        globalId: 'gitlabUrl=' + encodeURIComponent(gitlabUrl.toString()) + '&projectId=' + event.targetProjectId + '&mergeId=' + event.mergeId,
        application: {
            type: 'com.gitlab',
            name: 'Gitlab',
        },
        relationship: event.targetPath,
        object: {
            url: event.mergeUrl,
            title: event.shortcut + ' ' + event.mergeTitle,
            summary: formatDate(event.updatedAt, timeZone),
            icon: {
                url16x16: iconUrls[objectIcon],
                title: objectTitle,
            },
            status: {
                resolved: event.mergeState !== 'opened' && event.mergeState !== 'locked',
                icon: {
                    url16x16: iconUrls[statusIcon],
                    title: statusTitle,
                    link: statusUrl,
                },
            },
        },
    };
}
