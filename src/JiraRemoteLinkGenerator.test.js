var JiraRemoteLinkGenerator = require('./JiraRemoteLinkGenerator');
var jiraRemoteLinkGenerator = new JiraRemoteLinkGenerator();

test('generate merged mergeRequest', () => {

    let rawEvent = {
        "type": "merge_request",
        "shortcut": "!1",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-gitlab-ci-test",
        "mergeTitle": "Integration für TEST-12345 eingefügt",
        "mergeStatus": "can_be_merged",
        "mergeId": 10820,
        "mergeState": "merged",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-14T09:08:01.240Z",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/1",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-gitlab-ci-test/pipeline.svg",
        "pipelineId": 38052,
    };

    let rawResponse = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(rawEvent);

    const jiraRemoteLink = {
        "globalId": "gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10820",
        "application": {
            "type":"com.gitlab",
            "name":"Gitlab"
        },
        "relationship":"Gitlab Merge Request",
        "object": {
            "url": "https://git.example.org/example/jira-test/merge_requests/1",
            "title": "example/jira-test !1 Integration für TEST-12345 eingefügt",
            "summary": "",
            "icon": {
                "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-merge.png",
                "title":"Merged Merge Request"
            },
            "status": {
                "resolved": true,
                "icon": {
                    "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/checklist.png",
                    "title":"Can be Merged",
                    "link": "https://git.example.org/example/jira-test/merge_requests/1"
                }
            }
        }
    };

    expect(rawResponse).toEqual(jiraRemoteLink);
});


test('generate wip mergeRequest', () => {

    let rawEvent = {
        "type": "merge_request",
        "shortcut": "!1",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-gitlab-ci-test",
        "mergeTitle": "WIP: Integration für TEST-12345 eingefügt",
        "mergeStatus": "can_be_merged",
        "mergeId": 10820,
        "mergeState": "opened",
        "isWorkInProgress": true,
        "updatedAt": "2018-09-14T09:08:01.240Z",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/1",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-gitlab-ci-test/pipeline.svg",
        "pipelineId": 38052,
    };

    let rawResponse = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(rawEvent);

    const jiraRemoteLink = {
        "globalId": "gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10820",
        "application": {
            "type":"com.gitlab",
            "name":"Gitlab"
        },
        "relationship":"Gitlab Merge Request",
        "object": {
            "url": "https://git.example.org/example/jira-test/merge_requests/1",
            "summary": "",
            "title": "example/jira-test !1 WIP: Integration für TEST-12345 eingefügt",
            "icon": {
                "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-pull-request.png",
                "title":"Open Merge Request"
            },
            "status": {
                "resolved": false,
                "icon": {
                    "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/checklist.png",
                    "title":"Can be Merged",
                    "link": "https://git.example.org/example/jira-test/merge_requests/1"
                }
            }
        }
    };

    expect(rawResponse).toEqual(jiraRemoteLink);
});

test('generate canceled mergeRequest', () => {

    let rawEvent = {
        "type": "merge_request",
        "shortcut": "!2",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-canceled-test",
        "mergeTitle": "Canceled test",
        "mergeStatus": "can_be_merged",
        "mergeId": 10840,
        "mergeState": "closed",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 06:33:17 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/2",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-canceled-test/pipeline.svg",
        "pipelineId": 38532,
    };

    let rawResponse = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(rawEvent);

    const jiraRemoteLink = {
        "globalId": "gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10840",
        "application": {
            "type":"com.gitlab",
            "name":"Gitlab"
        },
        "relationship":"Gitlab Merge Request",
        "object": {
            "url": "https://git.example.org/example/jira-test/merge_requests/2",
            "summary": "",
            "title": "example/jira-test !2 Canceled test",
            "icon": {
                "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/circle-slash.png",
                "title":"Canceled Merge Request"
            },
            "status": {
                "resolved": true,
                "icon": {
                    "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/checklist.png",
                    "title":"Can be Merged",
                    "link": "https://git.example.org/example/jira-test/merge_requests/2"
                }
            }
        }
    };

    expect(rawResponse).toEqual(jiraRemoteLink);
});

test('generate open mergeRequest', () => {

    let rawEvent = {
        "type": "merge_request",
        "shortcut": "!3",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-open-test",
        "mergeTitle": "Open MR",
        "mergeStatus": "unchecked",
        "mergeId": 10841,
        "mergeState": "opened",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 06:50:00 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/3",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-open-test/pipeline.svg",
        "pipelineId": 38537,
    };

    let rawResponse = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(rawEvent);

    const jiraRemoteLink = {
        "globalId": "gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10841",
        "application": {
            "type":"com.gitlab",
            "name":"Gitlab"
        },
        "relationship":"Gitlab Merge Request",
        "object": {
            "url": "https://git.example.org/example/jira-test/merge_requests/3",
            "summary": "",
            "title": "example/jira-test !3 Open MR",
            "icon": {
                "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-pull-request.png",
                "title":"Open Merge Request"
            },
            "status": {
                "resolved": false,
                "icon": {
                    "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/clock.png",
                    "title":"Unchecked",
                    "link": "https://git.example.org/example/jira-test/merge_requests/3"
                }
            }
        }
    };

    expect(rawResponse).toEqual(jiraRemoteLink);
});

test('generate conflicting mergeRequest', () => {

    let rawEvent = {
        "type": "merge_request",
        "shortcut": "!5",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-conflicting-merge-request",
        "mergeTitle": "Added conflict !",
        "mergeStatus": "cannot_be_merged",
        "mergeId": 10843,
        "mergeState": "opened",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 07:40:45 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/5",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-conflicting-merge-request/pipeline.svg",
        "pipelineId": 38550,
    };

    let rawResponse = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(rawEvent);

    const jiraRemoteLink = {
        "globalId": "gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10843",
        "application": {
            "type":"com.gitlab",
            "name":"Gitlab"
        },
        "relationship":"Gitlab Merge Request",
        "object": {
            "url": "https://git.example.org/example/jira-test/merge_requests/5",
            "summary": "",
            "title": "example/jira-test !5 Added conflict !",
            "icon": {
                "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-pull-request.png",
                "title":"Open Merge Request"
            },
            "status": {
                "resolved": false,
                "icon": {
                    "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/alert.png",
                    "title":"Cannot be Merged",
                    "link": "https://git.example.org/example/jira-test/merge_requests/5"
                }
            }
        }
    };

    expect(rawResponse).toEqual(jiraRemoteLink);
});



test('generate open mergeRequest with failed pipeline', () => {

    let rawEvent = {
        "type": "merge_request",
        "shortcut": "!3",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-open-test",
        "mergeTitle": "Open MR",
        "mergeStatus": "unchecked",
        "mergeId": 10841,
        "mergeState": "opened",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 06:50:00 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/3",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-open-test/pipeline.svg",
        "pipelineId": 38537,
        "pipelineStatus": "failed",
        "pipelineUrl": "https://git.example.org/example/jira-test/pipelines/38537",
    };

    let rawResponse = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(rawEvent);

    const jiraRemoteLink = {
        "globalId": "gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10841",
        "application": {
            "type":"com.gitlab",
            "name":"Gitlab"
        },
        "relationship":"Gitlab Merge Request",
        "object": {
            "url": "https://git.example.org/example/jira-test/merge_requests/3",
            "summary": "",
            "title": "example/jira-test !3 Open MR",
            "icon": {
                "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-pull-request.png",
                "title":"Open Merge Request"
            },
            "status": {
                "resolved": false,
                "icon": {
                    "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/stop.png",
                    "title":"Pipeline failed",
                    "link": "https://git.example.org/example/jira-test/pipelines/38537"
                }
            }
        }
    };

    expect(rawResponse).toEqual(jiraRemoteLink);
});


test('generate open mergeRequest with pending pipeline', () => {

    let rawEvent = {
        "type": "merge_request",
        "shortcut": "!3",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-open-test",
        "mergeTitle": "Open MR",
        "mergeStatus": "unchecked",
        "mergeId": 10841,
        "mergeState": "opened",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 06:50:00 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/3",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-open-test/pipeline.svg",
        "pipelineId": 38537,
        "pipelineStatus": "pending",
        "pipelineUrl": "https://git.example.org/example/jira-test/pipelines/38537",
    };

    let rawResponse = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(rawEvent);

    const jiraRemoteLink = {
        "globalId": "gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10841",
        "application": {
            "type":"com.gitlab",
            "name":"Gitlab"
        },
        "relationship":"Gitlab Merge Request",
        "object": {
            "url": "https://git.example.org/example/jira-test/merge_requests/3",
            "summary": "",
            "title": "example/jira-test !3 Open MR",
            "icon": {
                "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-pull-request.png",
                "title":"Open Merge Request"
            },
            "status": {
                "resolved": false,
                "icon": {
                    "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/clock.png",
                    "title":"Pipeline pending",
                    "link": "https://git.example.org/example/jira-test/pipelines/38537"
                }
            }
        }
    };

    expect(rawResponse).toEqual(jiraRemoteLink);
});



test('generate open mergeRequest with running pipeline', () => {

    let rawEvent = {
        "type": "merge_request",
        "shortcut": "!3",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-open-test",
        "mergeTitle": "Open MR",
        "mergeStatus": "unchecked",
        "mergeId": 10841,
        "mergeState": "opened",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 06:50:00 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/3",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-open-test/pipeline.svg",
        "pipelineId": 38537,
        "pipelineStatus": "running",
        "pipelineUrl": "https://git.example.org/example/jira-test/pipelines/38537",
    };

    let rawResponse = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(rawEvent);

    const jiraRemoteLink = {
        "globalId": "gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10841",
        "application": {
            "type":"com.gitlab",
            "name":"Gitlab"
        },
        "relationship":"Gitlab Merge Request",
        "object": {
            "url": "https://git.example.org/example/jira-test/merge_requests/3",
            "summary": "",
            "title": "example/jira-test !3 Open MR",
            "icon": {
                "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-pull-request.png",
                "title":"Open Merge Request"
            },
            "status": {
                "resolved": false,
                "icon": {
                    "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/server.png",
                    "title":"Pipeline running",
                    "link": "https://git.example.org/example/jira-test/pipelines/38537"
                }
            }
        }
    };

    expect(rawResponse).toEqual(jiraRemoteLink);
});

test('generate open mergeRequest with success pipeline', () => {

    let rawEvent = {
        "type": "merge_request",
        "shortcut": "!3",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-open-test",
        "mergeTitle": "Open MR",
        "mergeStatus": "unchecked",
        "mergeId": 10841,
        "mergeState": "opened",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 06:50:00 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/3",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-open-test/pipeline.svg",
        "pipelineId": 38537,
        "pipelineStatus": "success",
        "pipelineUrl": "https://git.example.org/example/jira-test/pipelines/38537",
    };

    let rawResponse = jiraRemoteLinkGenerator.generateRemoteLinkFromEvent(rawEvent);

    const jiraRemoteLink = {
        "globalId": "gitlabUrl=https%3A%2F%2Fgit.example.org%2F&projectId=1422&mergeId=10841",
        "application": {
            "type":"com.gitlab",
            "name":"Gitlab"
        },
        "relationship":"Gitlab Merge Request",
        "object": {
            "url": "https://git.example.org/example/jira-test/merge_requests/3",
            "summary": "",
            "title": "example/jira-test !3 Open MR",
            "icon": {
                "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/git-pull-request.png",
                "title":"Open Merge Request"
            },
            "status": {
                "resolved": false,
                "icon": {
                    "url16x16":"https://raw.githubusercontent.com/webdog/octicons-png/master/black/clock.png",
                    "title":"Unchecked",
                    "link": "https://git.example.org/example/jira-test/merge_requests/3"
                }
            }
        }
    };

    expect(rawResponse).toEqual(jiraRemoteLink);
});