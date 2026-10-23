/**
 * Maps the deprecated `merge_status` values onto `detailed_merge_status`,
 * for merge requests that don't have the detailed field.
 */
const LEGACY_MERGE_STATUS = {
    can_be_merged: 'mergeable',
    cannot_be_merged: 'conflict',
    cannot_be_merged_recheck: 'checking',
    cannot_be_merged_rechecking: 'checking',
    checking: 'checking',
    unchecked: 'unchecked',
};

/** "group/project!12" -> "group/project" */
function pathFromReference(reference) {
    const index = reference?.lastIndexOf('!') ?? -1;
    return index > 0 ? reference.slice(0, index) : undefined;
}

/** ".../group/project/-/merge_requests/12" -> ".../group/project" */
function projectUrlFromMergeRequestUrl(webUrl) {
    const match = /^(.*?)(?:\/-)?\/merge_requests\/\d+\/?$/.exec(webUrl ?? '');
    return match ? match[1] : undefined;
}

/**
 * Turns a merge request from the GitLab REST API (GET /projects/:id/merge_requests/:iid)
 * into the flat event that the link generator and ticket extractor work with.
 *
 * @param {object} mergeRequest REST API merge request
 * @param {object} [targetProject] project of the merge request, used when the request lacks path information
 */
export function parseMergeRequest(mergeRequest, targetProject) {
    const targetUrl = projectUrlFromMergeRequestUrl(mergeRequest.web_url) ?? targetProject?.web_url;
    const event = {
        type: 'merge_request',
        shortcut: '!' + mergeRequest.iid,
        targetProjectId: mergeRequest.project_id ?? mergeRequest.target_project_id,
        targetPath: pathFromReference(mergeRequest.references?.full) ?? targetProject?.path_with_namespace,
        targetUrl,
        targetBranch: mergeRequest.target_branch,
        sourceBranch: mergeRequest.source_branch,
        mergeTitle: mergeRequest.title,
        mergeDescription: mergeRequest.description,
        mergeStatus: mergeRequest.detailed_merge_status ?? LEGACY_MERGE_STATUS[mergeRequest.merge_status] ?? mergeRequest.merge_status,
        mergeId: mergeRequest.id,
        mergeState: mergeRequest.state,
        isDraft: Boolean(mergeRequest.draft ?? mergeRequest.work_in_progress),
        updatedAt: mergeRequest.updated_at,
        mergeUrl: mergeRequest.web_url,
    };

    const pipeline = mergeRequest.head_pipeline ?? mergeRequest.pipeline;
    if (pipeline) {
        event.pipelineId = pipeline.id;
        event.pipelineStatus = pipeline.status;
        event.pipelineUrl = pipeline.web_url ?? (targetUrl && `${targetUrl}/-/pipelines/${pipeline.id}`);
    }

    return event;
}
