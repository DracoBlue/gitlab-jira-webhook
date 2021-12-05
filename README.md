# GitLab Jira Webhook [![Build Status](https://travis-ci.com/DracoBlue/gitlab-jira-webhook.svg?branch=master)](https://travis-ci.com/DracoBlue/gitlab-jira-webhook)

This little webhook pushes GitLab events directly to Jira, so they are displayed in Jira tickets as remote links to the GitLab Merge Request.


In Jira it looks like this:

![Screenshot](./screenshot.png)

## Setup

### 1. Create a .env-File

### 2. a) Jira with Username + Password

.env:
```
GITLAB_PERSONAL_ACCESS_TOKEN=jashdjsahdsjadsas
GITLAB_BASE_URL=https://git.example.org
GITLAB_WEBHOOK_TOKEN=TheToken
JIRA_BASE_URL=https://jira.example.org
JIRA_USERNAME=jirauser
JIRA_PASSWORD=thepassword
```

### 2. b) Jira with P12/PFX

.env:
```
GITLAB_PERSONAL_ACCESS_TOKEN=jashdjsahdsjadsas
GITLAB_BASE_URL=https://git.example.org
GITLAB_WEBHOOK_TOKEN=TheToken
JIRA_PFX_PATH=./user_key.p12
JIRA_PFX_PASSWORD=ThePassword
JIRA_BASE_URL=https://jira.example.org
```

If you need to setup a https proxy, use:
```
JIRA_HTTPS_PROXY=http://username:password@proxy.example.org:3128
```

### 3. a) Run with Nodejs + Run the Service

```console
$ npm install
$ npm start
```


### 3. b) Run with Docker

```console
$ docker run --rm --env-file .env -p80:3000 dracoblue/gitlab-jira-webhook
```

### Setup a Webhook in Gitlab

1. Set URL to http://example.org/events if your Webhook runs on http://example.org.
2. Set the token to something, which you will configured in `GITLAB_WEBHOOK_TOKEN`.

### That's it!

Now your merge requests should be visible whenever your reference a ticket with TEST-1234 at the
ticket.

## Private Icon Url Map

By default all icons will be loaded from [`https://raw.githubusercontent.com/webdog/octicons-png/master/black/*`](https://github.com/webdog/octicons-png/tree/master/black).

If you want to override the file, configure it with the `ICON_URL_PATH` and store the file
[`icon-url-map.json`](icon-url-map.json)
of this repository at a different place next to the storage.

## Tricky Implementation Details

- Jira: Jira shows only the last 5 (remote) links for an issue
  - Thus you shouldn't add too many merge requests to one Ticket
- GitLab: If on first push the merge is conflicted: the merge event does not appear!
  - Thus we fetch the merge request again as soon as a pipeline finishes.

## License

This work is copyright by DracoBlue (<http://dracoblue.net>) and licensed under the terms of MIT License.
