var debug = require('debug')('bridge:JiraRemoteLinkGenerator');
var url = require('url');
var formatDate = require('date-fns').format;
var iconUrlMap = JSON.parse(fs.readFileSync((process.env.ICON_URL_PATH || './') + 'icon-url-map.json'));

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

        var objectIconUrl = iconUrlMap["default"];
        var objectTitle = "Open Merge Request";

        if (event.mergeState === 'closed') {
            objectTitle = "Canceled Merge Request";
            objectIconUrl = iconUrlMap['closed'];
        }

        if (event.mergeState === 'locked') {
            objectTitle = "Locked Merge Request";
            objectIconUrl = iconUrlMap['locked'];
        }

        if (event.mergeState === 'merged') {
            objectIconUrl = iconUrlMap['merged'];
            objectTitle = "Merged Merge Request";
        }

        var statusIconUrl = iconUrlMap['unchecked'];
        var statusTitle = 'Unchecked';
        var statusUrl = event.mergeUrl;

        if (event.mergeStatus === 'can_be_merged') {
            statusIconUrl = iconUrlMap['can_be_merged'];
            statusTitle = 'Can be Merged';
        }

        if (event.mergeStatus === 'cannot_be_merged') {
            statusIconUrl = iconUrlMap['cannot_be_merged'];
            statusTitle = 'Cannot be Merged';
        }

        if (event.pipelineStatus && event.pipelineUrl) {
            if (event.pipelineStatus === "pending") {
                statusIconUrl = iconUrlMap['pending'];
                statusTitle = 'Pipeline pending';
                statusUrl = event.pipelineUrl;
            }
            if (event.pipelineStatus === "running") {
                statusIconUrl = iconUrlMap['running'];
                statusTitle = 'Pipeline running';
                statusUrl = event.pipelineUrl;
            }
            if (event.pipelineStatus === "failed") {
                statusIconUrl = iconUrlMap['failed'];
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