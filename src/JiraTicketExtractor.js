/**
 * Jira issue keys: a project key (uppercase letter, then uppercase letters, digits or
 * underscores) followed by a dash and the issue number. The lookarounds keep it from
 * matching inside a longer word or number.
 */
const ISSUE_KEY = /(?<![A-Za-z0-9_])[A-Z][A-Z0-9_]+-\d+(?![0-9])/g;

/**
 * Returns the unique Jira issue keys mentioned in the source branch, title or description,
 * in order of first appearance.
 *
 * @param {{ sourceBranch?: string, mergeTitle?: string, mergeDescription?: string }} event
 * @param {{ projectKeys?: string[] }} [options] when non-empty, only keys of these Jira projects are returned
 */
export function extractIssueKeys(event, { projectKeys = [] } = {}) {
    const text = [event.sourceBranch, event.mergeTitle, event.mergeDescription]
        .filter(Boolean)
        .join(' ');
    let keys = [...new Set(text.match(ISSUE_KEY) ?? [])];
    if (projectKeys.length > 0) {
        const allowed = new Set(projectKeys);
        keys = keys.filter((key) => allowed.has(key.slice(0, key.lastIndexOf('-'))));
    }
    return keys;
}
