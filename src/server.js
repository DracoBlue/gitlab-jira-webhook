require('dotenv').config()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var assert = require('assert');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var debug = require('debug')('bridge:server');
var tunnel = require('tunnel');

var GitlabEventParser = require('./GitlabEventParser');
var parser = new GitlabEventParser();
var JiraRemoteLinkGenerator = require('./JiraRemoteLinkGenerator');
var jiraRemoteLinkGenerator = new JiraRemoteLinkGenerator(true);
var JiraTicketExtractor = require('./JiraTicketExtractor');
var jiraTicketExtractor = new JiraTicketExtractor();
const got = require('got');

assert(process.env.JIRA_BASE_URL, "JIRA_BASE_URL is not set")
assert(process.env.GITLAB_WEBHOOK_TOKEN, "GITLAB_WEBHOOK_TOKEN is not set")
assert(process.env.GITLAB_BASE_URL, "GITLAB_BASE_URL is not set")
assert(process.env.GITLAB_PERSONAL_ACCESS_TOKEN, "GITLAB_PERSONAL_ACCESS_TOKEN is not set")

app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header('X-App-Version', process.env.APP_VERSION);
    res.header('X-App-Name', 'gitlab-jira-webhook');
    next();
});

app.get('/', function (req, res) {
    res.send('OK');
});

app.post('/events', function (req, res) {

    var fs = require('fs');

    debug('X-Gitlab-Token', req.headers['x-gitlab-token']);

    if (req.headers['x-gitlab-token'] !== process.env.GITLAB_WEBHOOK_TOKEN) {
        debug('invalid gitlab token')
        res.sendStatus(403);
        return ;
    }

    if (process.env.STORE_EVENTS) {
        var cacheFileName = 'data/';
        cacheFileName += req.body.object_kind;
        cacheFileName += "." + (new Date().getTime()) + ".json";
        debug("file:", cacheFileName)
        fs.writeFile(cacheFileName, JSON.stringify(req.body, null, 2), () => {
        });
    }

    var notifyTicketsForEvent = (event) => {
        var remoteLink = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(event);
        var ticketIds = jiraTicketExtractor.getTicketIdsFromEvent(event);

        ticketIds.forEach((ticketId) => {
            debug('notify ticket ' + ticketId);
            debug(JSON.stringify(remoteLink, null, 2));
            var options = {
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(remoteLink)
            };

            if (process.env.JIRA_USERNAME) {
                options.auth = process.env.JIRA_USERNAME + ':' + process.env.JIRA_PASSWORD;
            }

            if (process.env.JIRA_PFX_PATH) {
                options.pfx = fs.readFileSync(process.env.JIRA_PFX_PATH);
            }
            if (process.env.JIRA_PFX_PASSWORD) {
                options.passphrase = process.env.JIRA_PFX_PASSWORD;
            }

            if (process.env.JIRA_HTTPS_PROXY) {
                var urlParts = require('url').parse(process.env.JIRA_HTTPS_PROXY);
                options.agent = tunnel.httpsOverHttp({
                    proxy: {
                        host: urlParts.hostname,
                        port: urlParts.port,
                        proxyAuth: urlParts.auth,
                    }
                });
            }

            got.post(process.env.JIRA_BASE_URL + '/rest/api/latest/issue/'+ ticketId +'/remotelink', options).then((response) => {
                debug(response.body);
            });
        });
    };

    var notfyMergeRequestIidAndRawProject = (mergeRequestIid, rawProject) => {
        got.get(process.env.GITLAB_BASE_URL + '/api/v4/projects/' + rawProject.id + '/merge_requests/' + mergeRequestIid, {
            json: true,
            headers: {
                "Private-Token": process.env.GITLAB_PERSONAL_ACCESS_TOKEN
            }
        }).then((rawMergeRequestResponse) => {
            var event = parser.parseMergeRequestAndTargetProject(rawMergeRequestResponse.body, rawProject);
            notifyTicketsForEvent(event);
        });
    };

    if (req.body.object_kind === "merge_request") {
        notfyMergeRequestIidAndRawProject(req.body.object_attributes.iid, req.body.project);
    }

    /*
     * If a merge request is created, it's defined as "unchecked" and doesn't recieve any updates!
     * If we recieve an update for a pipeline, we want to notify all related merge requests, too!
     */
    if (req.body.object_kind === "pipeline") {
        var projectId = req.body.project.id;
        var rawProject = req.body.project;
        var commitId = req.body.commit.id;

        got.get(process.env.GITLAB_BASE_URL + '/api/v4/projects/' + projectId + '/repository/commits/'+ commitId +'/merge_requests', {
            json: true,
            headers: {
                "Private-Token": process.env.GITLAB_PERSONAL_ACCESS_TOKEN
            }
        }).then((rawMergeRequestSummariesResponse) => {
            /* The summaries don't contain the pipeline property + status -> thus we need to refetch it */
            rawMergeRequestSummariesResponse.body.forEach((rawMergeRequestSummaryResponse) => {
                notfyMergeRequestIidAndRawProject(rawMergeRequestSummaryResponse.iid, rawProject);
            });
        });
    }
    res.send('OK');
});

var port = process.env.PORT || 3000;

app.listen(port, function () {
    debug('listening on port ' + port);
});
