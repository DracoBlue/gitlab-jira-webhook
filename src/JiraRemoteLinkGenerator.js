var debug = require('debug')('bridge:JiraRemoteLinkGenerator');
var url = require('url');
var formatDate = require('date-fns').format;

class JiraRemoteLinkGenerator {

    constructor (newMode = false) {
        debug('created')
        this.newMode = newMode;
    }

    generateRemoteLinkFromEvent (event) {
        debug('generateRemoteLinkFromEvent')

        var urlParts = new URL(event.mergeUrl);
        urlParts.pathname = '';
        urlParts.search = '';

        var objectIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-pull-request.png";
        var objectTitle = "Open Merge Request";

        if (event.mergeState === 'closed') {
            objectTitle = "Canceled Merge Request";
            objectIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/circle-slash.png";
        }

        if (event.mergeState === 'locked') {
            objectTitle = "Locked Merge Request";
            objectIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/lock.png";
        }

        if (event.mergeState === 'merged') {
            objectIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-merge.png";
            objectTitle = "Merged Merge Request";
        }

        var statusIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/clock.png";
        var statusTitle = 'Unchecked';
        var statusUrl = event.mergeUrl;

        if (event.mergeStatus === 'can_be_merged') {
            statusIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/checklist.png";
            statusTitle = 'Can be Merged';
        }

        if (event.mergeStatus === 'cannot_be_merged') {
            statusIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/alert.png";
            statusTitle = 'Cannot be Merged';
        }

        if (event.pipelineStatus && event.pipelineUrl) {
            if (event.pipelineStatus === "pending") {
                statusIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/clock.png";
                statusTitle = 'Pipeline pending';
                statusUrl = event.pipelineUrl;
            }
            if (event.pipelineStatus === "running") {
                statusIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/server.png";
                statusTitle = 'Pipeline running';
                statusUrl = event.pipelineUrl;
            }
            if (event.pipelineStatus === "failed") {
                statusIconUrl = "https://raw.githubusercontent.com/webdog/octicons-png/master/black/stop.png";
                statusTitle = 'Pipeline failed';
                statusUrl = event.pipelineUrl;
            }
        }

        var title = event.targetPath + " " + event.shortcut + " " + event.mergeTitle;
        var summary = "";
        var relationship = "Gitlab Merge Request";

        if (this.newMode) {
            title = event.shortcut + " " + event.mergeTitle;
            summary = formatDate(new Date(event.updatedAt), 'YYYY/MM/DD HH:mm');
            relationship = event.targetPath;
        }

        const jiraRemoteLink = {
            "globalId": "gitlabUrl=" + encodeURIComponent(urlParts.toString()) + "&projectId=" + event.targetProjectId + "&mergeId=" + event.mergeId,
            "application": {
                "type":"com.gitlab",
                "name":"Gitlab"
            },
            "relationship": relationship,
            "object": {
                "url": event.mergeUrl,
                "title": title,
                "summary": summary,
                "icon": {
                    "url16x16": objectIconUrl,
                    "title":objectTitle
                },
                "status": {
                    "resolved": ['opened', 'locked'].indexOf(event.mergeState) === -1,
                    "icon": {
                        "url16x16": statusIconUrl,
                        "title": statusTitle,
                        "link": statusUrl
                    }
                }
            }
        };

        return jiraRemoteLink;
    }

}

module.exports = JiraRemoteLinkGenerator;