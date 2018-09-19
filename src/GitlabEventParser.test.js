var GitlabEventParser = require('./GitlabEventParser');
var parser = new GitlabEventParser();

test('parseEvent merged mergeRequest', () => {
    var rawData = {
        "object_kind": "merge_request",
        "event_type": "merge_request",
        "user": {
            "name": "Mister Example",
            "username": "example",
            "avatar_url": "https://secure.gravatar.com/avatar/d733ac42482dc89c17449f4ea15d758c?s=80&d=identicon"
        },
        "project": {
            "id": 1422,
            "name": "jira-test",
            "description": "",
            "web_url": "https://git.example.org/example/jira-test",
            "avatar_url": null,
            "git_ssh_url": "git@git.example.org:example/jira-test.git",
            "git_http_url": "https://git.example.org/example/jira-test.git",
            "namespace": "example",
            "visibility_level": 0,
            "path_with_namespace": "example/jira-test",
            "default_branch": "master",
            "ci_config_path": null,
            "homepage": "https://git.example.org/example/jira-test",
            "url": "git@git.example.org:example/jira-test.git",
            "ssh_url": "git@git.example.org:example/jira-test.git",
            "http_url": "https://git.example.org/example/jira-test.git"
        },
        "object_attributes": {
            "assignee_id": null,
            "author_id": 6,
            "created_at": "2018-09-16 07:21:27 UTC",
            "description": "Closes TEST-12345",
            "head_pipeline_id": 38545,
            "id": 10842,
            "iid": 4,
            "last_edited_at": null,
            "last_edited_by_id": null,
            "merge_commit_sha": "0843bcb100df0f3bf48ea451d009ba98c5c620d5",
            "merge_error": null,
            "merge_params": {
                "force_remove_source_branch": "1",
                "should_remove_source_branch": true,
                "commit_message": "Merge branch 'feature/TEST-12345-gitlab-ci-test' into 'master'\n\nUpdated\n\nCloses TEST-12345\n\nSee merge request example/jira-test!4",
                "squash": false
            },
            "merge_status": "can_be_merged",
            "merge_user_id": 6,
            "merge_when_pipeline_succeeds": true,
            "milestone_id": null,
            "source_branch": "feature/TEST-12345-gitlab-ci-test",
            "source_project_id": 1422,
            "state": "merged",
            "target_branch": "master",
            "target_project_id": 1422,
            "time_estimate": 0,
            "title": "Updated",
            "updated_at": "2018-09-16 07:21:38 UTC",
            "updated_by_id": null,
            "url": "https://git.example.org/example/jira-test/merge_requests/4",
            "source": {
                "id": 1422,
                "name": "jira-test",
                "description": "",
                "web_url": "https://git.example.org/example/jira-test",
                "avatar_url": null,
                "git_ssh_url": "git@git.example.org:example/jira-test.git",
                "git_http_url": "https://git.example.org/example/jira-test.git",
                "namespace": "example",
                "visibility_level": 0,
                "path_with_namespace": "example/jira-test",
                "default_branch": "master",
                "ci_config_path": null,
                "homepage": "https://git.example.org/example/jira-test",
                "url": "git@git.example.org:example/jira-test.git",
                "ssh_url": "git@git.example.org:example/jira-test.git",
                "http_url": "https://git.example.org/example/jira-test.git"
            },
            "target": {
                "id": 1422,
                "name": "jira-test",
                "description": "",
                "web_url": "https://git.example.org/example/jira-test",
                "avatar_url": null,
                "git_ssh_url": "git@git.example.org:example/jira-test.git",
                "git_http_url": "https://git.example.org/example/jira-test.git",
                "namespace": "example",
                "visibility_level": 0,
                "path_with_namespace": "example/jira-test",
                "default_branch": "master",
                "ci_config_path": null,
                "homepage": "https://git.example.org/example/jira-test",
                "url": "git@git.example.org:example/jira-test.git",
                "ssh_url": "git@git.example.org:example/jira-test.git",
                "http_url": "https://git.example.org/example/jira-test.git"
            },
            "last_commit": {
                "id": "7987c294759a41363680fd7bc75d0a1b0d818e66",
                "message": "Updated\n",
                "timestamp": "2018-09-16T07:25:21Z",
                "url": "https://git.example.org/example/jira-test/commit/7987c294759a41363680fd7bc75d0a1b0d818e66",
                "author": {
                    "name": "Mister Example",
                    "email": "example@example.org"
                }
            },
            "work_in_progress": false,
            "total_time_spent": 0,
            "human_total_time_spent": null,
            "human_time_estimate": null,
            "action": "merge"
        },
        "labels": [],
        "changes": {
            "state": {
                "previous": "locked",
                "current": "merged"
            },
            "updated_at": {
                "previous": "2018-09-16 07:21:38 UTC",
                "current": "2018-09-16 07:21:38 UTC"
            },
            "total_time_spent": {
                "previous": null,
                "current": 0
            }
        },
        "repository": {
            "name": "jira-test",
            "url": "git@git.example.org:example/jira-test.git",
            "description": "",
            "homepage": "https://git.example.org/example/jira-test"
        }
    };

    const gitlabEvent = parser.parseEvent(rawData);

    let rawResponse = {
        "type": "merge_request",
        "shortcut": "!4",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-gitlab-ci-test",
        "mergeTitle": "Updated",
        "mergeDescription": "Closes TEST-12345",
        "mergeStatus": "can_be_merged",
        "mergeId": 10842,
        "mergeState": "merged",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 07:21:38 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/4",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-gitlab-ci-test/pipeline.svg",
        "pipelineId": 38545,
    };

    expect(gitlabEvent).toEqual(rawResponse);
});

test('parseEvent closed mergeRequest', () => {
    var rawData = {
        "object_kind": "merge_request",
        "event_type": "merge_request",
        "user": {
            "name": "Mister Example",
            "username": "example",
            "avatar_url": "https://secure.gravatar.com/avatar/d733ac42482dc89c17449f4ea15d758c?s=80&d=identicon"
        },
        "project": {
            "id": 1422,
            "name": "jira-test",
            "description": "",
            "web_url": "https://git.example.org/example/jira-test",
            "avatar_url": null,
            "git_ssh_url": "git@git.example.org:example/jira-test.git",
            "git_http_url": "https://git.example.org/example/jira-test.git",
            "namespace": "example",
            "visibility_level": 0,
            "path_with_namespace": "example/jira-test",
            "default_branch": "master",
            "ci_config_path": null,
            "homepage": "https://git.example.org/example/jira-test",
            "url": "git@git.example.org:example/jira-test.git",
            "ssh_url": "git@git.example.org:example/jira-test.git",
            "http_url": "https://git.example.org/example/jira-test.git"
        },
        "object_attributes": {
            "assignee_id": null,
            "author_id": 6,
            "created_at": "2018-09-16 06:27:21 UTC",
            "description": "Closes TEST-12345",
            "head_pipeline_id": 38532,
            "id": 10840,
            "iid": 2,
            "last_edited_at": null,
            "last_edited_by_id": null,
            "merge_commit_sha": null,
            "merge_error": null,
            "merge_params": {
                "force_remove_source_branch": "1"
            },
            "merge_status": "can_be_merged",
            "merge_user_id": null,
            "merge_when_pipeline_succeeds": false,
            "milestone_id": null,
            "source_branch": "feature/TEST-12345-canceled-test",
            "source_project_id": 1422,
            "state": "closed",
            "target_branch": "master",
            "target_project_id": 1422,
            "time_estimate": 0,
            "title": "Canceled test",
            "updated_at": "2018-09-16 06:33:17 UTC",
            "updated_by_id": null,
            "url": "https://git.example.org/example/jira-test/merge_requests/2",
            "source": {
                "id": 1422,
                "name": "jira-test",
                "description": "",
                "web_url": "https://git.example.org/example/jira-test",
                "avatar_url": null,
                "git_ssh_url": "git@git.example.org:example/jira-test.git",
                "git_http_url": "https://git.example.org/example/jira-test.git",
                "namespace": "example",
                "visibility_level": 0,
                "path_with_namespace": "example/jira-test",
                "default_branch": "master",
                "ci_config_path": null,
                "homepage": "https://git.example.org/example/jira-test",
                "url": "git@git.example.org:example/jira-test.git",
                "ssh_url": "git@git.example.org:example/jira-test.git",
                "http_url": "https://git.example.org/example/jira-test.git"
            },
            "target": {
                "id": 1422,
                "name": "jira-test",
                "description": "",
                "web_url": "https://git.example.org/example/jira-test",
                "avatar_url": null,
                "git_ssh_url": "git@git.example.org:example/jira-test.git",
                "git_http_url": "https://git.example.org/example/jira-test.git",
                "namespace": "example",
                "visibility_level": 0,
                "path_with_namespace": "example/jira-test",
                "default_branch": "master",
                "ci_config_path": null,
                "homepage": "https://git.example.org/example/jira-test",
                "url": "git@git.example.org:example/jira-test.git",
                "ssh_url": "git@git.example.org:example/jira-test.git",
                "http_url": "https://git.example.org/example/jira-test.git"
            },
            "last_commit": {
                "id": "f7c147ce8d7c02fe4070af052296ac39543855dc",
                "message": "Canceled test\n",
                "timestamp": "2018-09-16T06:30:30Z",
                "url": "https://git.example.org/example/jira-test/commit/f7c147ce8d7c02fe4070af052296ac39543855dc",
                "author": {
                    "name": "Mister Example",
                    "email": "example@example.org"
                }
            },
            "work_in_progress": false,
            "total_time_spent": 0,
            "human_total_time_spent": null,
            "human_time_estimate": null,
            "action": "close"
        },
        "labels": [],
        "changes": {
            "state": {
                "previous": "opened",
                "current": "closed"
            },
            "updated_at": {
                "previous": "2018-09-16 06:27:21 UTC",
                "current": "2018-09-16 06:33:17 UTC"
            },
            "total_time_spent": {
                "previous": null,
                "current": 0
            }
        },
        "repository": {
            "name": "jira-test",
            "url": "git@git.example.org:example/jira-test.git",
            "description": "",
            "homepage": "https://git.example.org/example/jira-test"
        }
    };

    const gitlabEvent = parser.parseEvent(rawData);

    let rawResponse = {
        "type": "merge_request",
        "shortcut": "!2",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-canceled-test",
        "mergeTitle": "Canceled test",
        "mergeDescription": "Closes TEST-12345",
        "mergeStatus": "can_be_merged",
        "mergeId": 10840,
        "mergeState": "closed",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 06:33:17 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/2",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-canceled-test/pipeline.svg",
        "pipelineId": 38532,
    };

    expect(gitlabEvent).toEqual(rawResponse);
});

test('parseEvent open mergeRequest', () => {
    var rawData = {
        "object_kind": "merge_request",
        "event_type": "merge_request",
        "user": {
            "name": "Mister Example",
            "username": "example",
            "avatar_url": "https://secure.gravatar.com/avatar/d733ac42482dc89c17449f4ea15d758c?s=80&d=identicon"
        },
        "project": {
            "id": 1422,
            "name": "jira-test",
            "description": "",
            "web_url": "https://git.example.org/example/jira-test",
            "avatar_url": null,
            "git_ssh_url": "git@git.example.org:example/jira-test.git",
            "git_http_url": "https://git.example.org/example/jira-test.git",
            "namespace": "example",
            "visibility_level": 0,
            "path_with_namespace": "example/jira-test",
            "default_branch": "master",
            "ci_config_path": null,
            "homepage": "https://git.example.org/example/jira-test",
            "url": "git@git.example.org:example/jira-test.git",
            "ssh_url": "git@git.example.org:example/jira-test.git",
            "http_url": "https://git.example.org/example/jira-test.git"
        },
        "object_attributes": {
            "assignee_id": null,
            "author_id": 6,
            "created_at": "2018-09-16 06:50:00 UTC",
            "description": "Closes TEST-12345",
            "head_pipeline_id": 38537,
            "id": 10841,
            "iid": 3,
            "last_edited_at": null,
            "last_edited_by_id": null,
            "merge_commit_sha": null,
            "merge_error": null,
            "merge_params": {
                "force_remove_source_branch": "1"
            },
            "merge_status": "unchecked",
            "merge_user_id": null,
            "merge_when_pipeline_succeeds": false,
            "milestone_id": null,
            "source_branch": "feature/TEST-12345-open-test",
            "source_project_id": 1422,
            "state": "opened",
            "target_branch": "master",
            "target_project_id": 1422,
            "time_estimate": 0,
            "title": "Open MR",
            "updated_at": "2018-09-16 06:50:00 UTC",
            "updated_by_id": null,
            "url": "https://git.example.org/example/jira-test/merge_requests/3",
            "source": {
                "id": 1422,
                "name": "jira-test",
                "description": "",
                "web_url": "https://git.example.org/example/jira-test",
                "avatar_url": null,
                "git_ssh_url": "git@git.example.org:example/jira-test.git",
                "git_http_url": "https://git.example.org/example/jira-test.git",
                "namespace": "example",
                "visibility_level": 0,
                "path_with_namespace": "example/jira-test",
                "default_branch": "master",
                "ci_config_path": null,
                "homepage": "https://git.example.org/example/jira-test",
                "url": "git@git.example.org:example/jira-test.git",
                "ssh_url": "git@git.example.org:example/jira-test.git",
                "http_url": "https://git.example.org/example/jira-test.git"
            },
            "target": {
                "id": 1422,
                "name": "jira-test",
                "description": "",
                "web_url": "https://git.example.org/example/jira-test",
                "avatar_url": null,
                "git_ssh_url": "git@git.example.org:example/jira-test.git",
                "git_http_url": "https://git.example.org/example/jira-test.git",
                "namespace": "example",
                "visibility_level": 0,
                "path_with_namespace": "example/jira-test",
                "default_branch": "master",
                "ci_config_path": null,
                "homepage": "https://git.example.org/example/jira-test",
                "url": "git@git.example.org:example/jira-test.git",
                "ssh_url": "git@git.example.org:example/jira-test.git",
                "http_url": "https://git.example.org/example/jira-test.git"
            },
            "last_commit": {
                "id": "493821d87c1ec75224c0a732020955fa69ac75bd",
                "message": "Open MR\n",
                "timestamp": "2018-09-16T06:53:52Z",
                "url": "https://git.example.org/example/jira-test/commit/493821d87c1ec75224c0a732020955fa69ac75bd",
                "author": {
                    "name": "Mister Example",
                    "email": "example@example.org"
                }
            },
            "work_in_progress": false,
            "total_time_spent": 0,
            "human_total_time_spent": null,
            "human_time_estimate": null,
            "action": "open"
        },
        "labels": [],
        "changes": {
            "head_pipeline_id": {
                "previous": null,
                "current": 38537
            },
            "updated_at": {
                "previous": "2018-09-16 06:50:00 UTC",
                "current": "2018-09-16 06:50:00 UTC"
            },
            "total_time_spent": {
                "previous": null,
                "current": 0
            }
        },
        "repository": {
            "name": "jira-test",
            "url": "git@git.example.org:example/jira-test.git",
            "description": "",
            "homepage": "https://git.example.org/example/jira-test"
        }
    };

    const gitlabEvent = parser.parseEvent(rawData);

    let rawResponse = {
        "type": "merge_request",
        "shortcut": "!3",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-open-test",
        "mergeTitle": "Open MR",
        "mergeDescription": "Closes TEST-12345",
        "mergeStatus": "unchecked",
        "mergeId": 10841,
        "mergeState": "opened",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 06:50:00 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/3",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-open-test/pipeline.svg",
        "pipelineId": 38537,
    };

    expect(gitlabEvent).toEqual(rawResponse);
});

test('parseEvent conflict mergeRequest', () => {
    var rawData = {
        "object_kind": "merge_request",
        "event_type": "merge_request",
        "user": {
            "name": "Mister Example",
            "username": "example",
            "avatar_url": "https://secure.gravatar.com/avatar/d733ac42482dc89c17449f4ea15d758c?s=80&d=identicon"
        },
        "project": {
            "id": 1422,
            "name": "jira-test",
            "description": "",
            "web_url": "https://git.example.org/example/jira-test",
            "avatar_url": null,
            "git_ssh_url": "git@git.example.org:example/jira-test.git",
            "git_http_url": "https://git.example.org/example/jira-test.git",
            "namespace": "example",
            "visibility_level": 0,
            "path_with_namespace": "example/jira-test",
            "default_branch": "master",
            "ci_config_path": null,
            "homepage": "https://git.example.org/example/jira-test",
            "url": "git@git.example.org:example/jira-test.git",
            "ssh_url": "git@git.example.org:example/jira-test.git",
            "http_url": "https://git.example.org/example/jira-test.git"
        },
        "object_attributes": {
            "assignee_id": null,
            "author_id": 6,
            "created_at": "2018-09-16 07:39:33 UTC",
            "description": "Closes TEST-12345",
            "head_pipeline_id": 38550,
            "id": 10843,
            "iid": 5,
            "last_edited_at": "2018-09-16 07:40:45 UTC",
            "last_edited_by_id": 6,
            "merge_commit_sha": null,
            "merge_error": null,
            "merge_params": {
                "force_remove_source_branch": "1"
            },
            "merge_status": "cannot_be_merged",
            "merge_user_id": null,
            "merge_when_pipeline_succeeds": false,
            "milestone_id": null,
            "source_branch": "feature/TEST-12345-conflicting-merge-request",
            "source_project_id": 1422,
            "state": "opened",
            "target_branch": "master",
            "target_project_id": 1422,
            "time_estimate": 0,
            "title": "Added conflict !",
            "updated_at": "2018-09-16 07:40:45 UTC",
            "updated_by_id": 6,
            "url": "https://git.example.org/example/jira-test/merge_requests/5",
            "source": {
                "id": 1422,
                "name": "jira-test",
                "description": "",
                "web_url": "https://git.example.org/example/jira-test",
                "avatar_url": null,
                "git_ssh_url": "git@git.example.org:example/jira-test.git",
                "git_http_url": "https://git.example.org/example/jira-test.git",
                "namespace": "example",
                "visibility_level": 0,
                "path_with_namespace": "example/jira-test",
                "default_branch": "master",
                "ci_config_path": null,
                "homepage": "https://git.example.org/example/jira-test",
                "url": "git@git.example.org:example/jira-test.git",
                "ssh_url": "git@git.example.org:example/jira-test.git",
                "http_url": "https://git.example.org/example/jira-test.git"
            },
            "target": {
                "id": 1422,
                "name": "jira-test",
                "description": "",
                "web_url": "https://git.example.org/example/jira-test",
                "avatar_url": null,
                "git_ssh_url": "git@git.example.org:example/jira-test.git",
                "git_http_url": "https://git.example.org/example/jira-test.git",
                "namespace": "example",
                "visibility_level": 0,
                "path_with_namespace": "example/jira-test",
                "default_branch": "master",
                "ci_config_path": null,
                "homepage": "https://git.example.org/example/jira-test",
                "url": "git@git.example.org:example/jira-test.git",
                "ssh_url": "git@git.example.org:example/jira-test.git",
                "http_url": "https://git.example.org/example/jira-test.git"
            },
            "last_commit": {
                "id": "23d4af0fe64d1c630d48d7f63ab66e74d6b5feb1",
                "message": "Added conflict\n",
                "timestamp": "2018-09-16T07:43:24Z",
                "url": "https://git.example.org/example/jira-test/commit/23d4af0fe64d1c630d48d7f63ab66e74d6b5feb1",
                "author": {
                    "name": "Mister Example",
                    "email": "example@example.org"
                }
            },
            "work_in_progress": false,
            "total_time_spent": 0,
            "human_total_time_spent": null,
            "human_time_estimate": null,
            "action": "update"
        },
        "labels": [],
        "changes": {
            "last_edited_at": {
                "previous": null,
                "current": "2018-09-16 07:40:45 UTC"
            },
            "last_edited_by_id": {
                "previous": null,
                "current": 6
            },
            "title": {
                "previous": "Added conflict",
                "current": "Added conflict !"
            },
            "updated_at": {
                "previous": "2018-09-16 07:40:34 UTC",
                "current": "2018-09-16 07:40:45 UTC"
            },
            "updated_by_id": {
                "previous": null,
                "current": 6
            }
        },
        "repository": {
            "name": "jira-test",
            "url": "git@git.example.org:example/jira-test.git",
            "description": "",
            "homepage": "https://git.example.org/example/jira-test"
        }
    };

    const gitlabEvent = parser.parseEvent(rawData);

    let rawResponse = {
        "type": "merge_request",
        "shortcut": "!5",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-conflicting-merge-request",
        "mergeTitle": "Added conflict !",
        "mergeDescription": "Closes TEST-12345",
        "mergeStatus": "cannot_be_merged",
        "mergeId": 10843,
        "mergeState": "opened",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16 07:40:45 UTC",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/5",
        "pipelineBadgeUrl": "https://git.example.org/example/jira-test/badges/feature/TEST-12345-conflicting-merge-request/pipeline.svg",
        "pipelineId": 38550,
    };

    expect(gitlabEvent).toEqual(rawResponse);
});

test('parseMergeRequestAndTargetProject', () => {
    var rawMergeRequestData = {
        "id": 10844,
        "iid": 6,
        "project_id": 1422,
        "title": "server test again",
        "description": "Closes TEST-12345",
        "state": "closed",
        "created_at": "2018-09-16T14:23:46.617Z",
        "updated_at": "2018-09-16T14:25:48.937Z",
        "target_branch": "master",
        "source_branch": "feature/TEST-12345-added-other-test",
        "upvotes": 0,
        "downvotes": 0,
        "author": {
            "id": 6,
            "name": "Mister Example",
            "username": "example",
            "state": "active",
            "avatar_url": "https://secure.gravatar.com/avatar/d733ac42482dc89c17449f4ea15d758c?s=80&d=identicon",
            "web_url": "https://git.example.org/example"
        },
        "assignee": null,
        "source_project_id": 1422,
        "target_project_id": 1422,
        "labels": [

        ],
        "work_in_progress": false,
        "milestone": null,
        "merge_when_pipeline_succeeds": false,
        "merge_status": "can_be_merged",
        "sha": "db65b6547005d154c23bdb42152577c2c6b8e10f",
        "merge_commit_sha": null,
        "user_notes_count": 0,
        "discussion_locked": null,
        "should_remove_source_branch": null,
        "force_remove_source_branch": true,
        "web_url": "https://git.example.org/example/jira-test/merge_requests/6",
        "time_stats": {
            "time_estimate": 0,
            "total_time_spent": 0,
            "human_time_estimate": null,
            "human_total_time_spent": null
        },
        "squash": false
    };

    var rawProjectData = {
        "id": 1422,
        "description": "",
        "name": "jira-test",
        "name_with_namespace": "Mister Example / jira-test",
        "path": "jira-test",
        "path_with_namespace": "example/jira-test",
        "created_at": "2018-09-14T09:04:08.368Z",
        "default_branch": "master",
        "tag_list": [

        ],
        "ssh_url_to_repo": "git@git.example.org:example/jira-test.git",
        "http_url_to_repo": "https://git.example.org/example/jira-test.git",
        "web_url": "https://git.example.org/example/jira-test",
        "readme_url": "https://git.example.org/example/jira-test/blob/master/README.md",
        "avatar_url": null,
        "star_count": 0,
        "forks_count": 0,
        "last_activity_at": "2018-09-16T14:23:39.543Z",
        "_links": {
            "self": "https://git.example.org/api/v4/projects/1422",
            "issues": "https://git.example.org/api/v4/projects/1422/issues",
            "merge_requests": "https://git.example.org/api/v4/projects/1422/merge_requests",
            "repo_branches": "https://git.example.org/api/v4/projects/1422/repository/branches",
            "labels": "https://git.example.org/api/v4/projects/1422/labels",
            "events": "https://git.example.org/api/v4/projects/1422/events",
            "members": "https://git.example.org/api/v4/projects/1422/members"
        },
        "archived": false,
        "visibility": "private",
        "owner": {
            "id": 6,
            "name": "Mister Example",
            "username": "example",
            "state": "active",
            "avatar_url": "https://secure.gravatar.com/avatar/d733ac42482dc89c17449f4ea15d758c?s=80&d=identicon",
            "web_url": "https://git.example.org/example"
        },
        "resolve_outdated_diff_discussions": false,
        "container_registry_enabled": true,
        "issues_enabled": true,
        "merge_requests_enabled": true,
        "wiki_enabled": true,
        "jobs_enabled": true,
        "snippets_enabled": true,
        "shared_runners_enabled": true,
        "lfs_enabled": true,
        "creator_id": 6,
        "namespace": {
            "id": 6,
            "name": "example",
            "path": "example",
            "kind": "user",
            "full_path": "example",
            "parent_id": null
        },
        "import_status": "none",
        "import_error": null,
        "open_issues_count": 0,
        "runners_token": "Ci_2tydXfDaJ5HKDt9q1",
        "public_jobs": true,
        "ci_config_path": null,
        "shared_with_groups": [

        ],
        "only_allow_merge_if_pipeline_succeeds": false,
        "request_access_enabled": false,
        "only_allow_merge_if_all_discussions_are_resolved": false,
        "printing_merge_request_link_enabled": true,
        "merge_method": "merge",
        "permissions": {
            "project_access": {
                "access_level": 40,
                "notification_level": 3
            },
            "group_access": null
        }
    };

    const gitlabEvent = parser.parseMergeRequestAndTargetProject(rawMergeRequestData, rawProjectData);

    let rawResponse = {
        "type": "merge_request",
        "shortcut": "!6",
        "targetProjectId": 1422,
        "targetPath": "example/jira-test",
        "targetUrl": "https://git.example.org/example/jira-test",
        "targetBranch": "master",
        "sourceBranch": "feature/TEST-12345-added-other-test",
        "mergeTitle": "server test again",
        "mergeDescription": "Closes TEST-12345",
        "mergeStatus": "can_be_merged",
        "mergeId": 10844,
        "mergeState": "closed",
        "isWorkInProgress": false,
        "updatedAt": "2018-09-16T14:25:48.937Z",
        "mergeUrl": "https://git.example.org/example/jira-test/merge_requests/6"
    };

    expect(gitlabEvent).toEqual(rawResponse);
});
