var debug = require('debug')('bridge:GitlabEventParser');
var GitlabEvent = require('./GitlabEvent');

class GitlabEventParser {

    constructor () {
        debug('created')
    }

    parseEvent (rawEvent) {
        debug('parse ', rawEvent.object_kind);

        let gitlabEvent = new GitlabEvent();

        gitlabEvent.type = rawEvent.object_kind;
        gitlabEvent.targetProjectId = rawEvent.object_attributes.target.id;
        gitlabEvent.targetPath = rawEvent.object_attributes.target.path_with_namespace;
        gitlabEvent.targetUrl = rawEvent.object_attributes.target.web_url;
        gitlabEvent.targetBranch = rawEvent.object_attributes.target_branch;
        gitlabEvent.sourceBranch = rawEvent.object_attributes.source_branch;
        gitlabEvent.mergeTitle = rawEvent.object_attributes.title;
        gitlabEvent.mergeDescription = rawEvent.object_attributes.description;
        gitlabEvent.mergeStatus = rawEvent.object_attributes.merge_status;
        gitlabEvent.mergeId = rawEvent.object_attributes.id;
        gitlabEvent.mergeState = rawEvent.object_attributes.state;
        gitlabEvent.updatedAt = rawEvent.object_attributes.updated_at;
        gitlabEvent.mergeUrl = rawEvent.object_attributes.url;
        gitlabEvent.pipelineId = rawEvent.object_attributes.head_pipeline_id;
        gitlabEvent.pipelineBadgeUrl = rawEvent.object_attributes.source.web_url + "/badges/" + gitlabEvent.sourceBranch + "/pipeline.svg";
        gitlabEvent.shortcut = "!" + rawEvent.object_attributes.iid;
        gitlabEvent.isWorkInProgress = rawEvent.object_attributes.work_in_progress;

        return gitlabEvent;
    }

    parseMergeRequestAndTargetProject (rawMergeRequest, rawTargetProject) {
        let gitlabEvent = new GitlabEvent();

        gitlabEvent.type = "merge_request";
        gitlabEvent.targetProjectId = rawMergeRequest.project_id;
        gitlabEvent.targetPath = rawTargetProject.path_with_namespace;
        gitlabEvent.targetUrl = rawTargetProject.web_url;
        gitlabEvent.targetBranch = rawMergeRequest.target_branch;
        gitlabEvent.sourceBranch = rawMergeRequest.source_branch;
        gitlabEvent.mergeTitle = rawMergeRequest.title;
        gitlabEvent.mergeDescription = rawMergeRequest.description;
        gitlabEvent.mergeStatus = rawMergeRequest.merge_status;
        gitlabEvent.mergeId = rawMergeRequest.id;
        gitlabEvent.mergeState = rawMergeRequest.state;
        gitlabEvent.updatedAt = rawMergeRequest.updated_at;
        gitlabEvent.mergeUrl = rawMergeRequest.web_url;
        if (rawMergeRequest.pipeline) {
            gitlabEvent.pipelineId = rawMergeRequest.pipeline.id;
            gitlabEvent.pipelineStatus = rawMergeRequest.pipeline.status;
            gitlabEvent.pipelineUrl = rawTargetProject.web_url + "/pipelines/" + gitlabEvent.pipelineId;
        }
        gitlabEvent.shortcut = "!" + rawMergeRequest.iid;
        gitlabEvent.isWorkInProgress = rawMergeRequest.work_in_progress;

        return gitlabEvent;
    }

}

module.exports = GitlabEventParser;