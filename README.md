# Gitlab Jira Webhook [![Build Status](https://travis-ci.com/DracoBlue/gitlab-jira-webhook.svg?branch=master)](https://travis-ci.com/DracoBlue/gitlab-jira-webhook)

This little webhook pushes gitlab events directly to jira as remote links.

![Screenshot](./screenshot.png)

## Setup

### Create a .env-File

#### a) Jira with Username + Password

.env:
```
GITLAB_PERSONAL_ACCESS_TOKEN=jashdjsahdsjadsas
GITLAB_BASE_URL=https://git.example.org
GITLAB_WEBHOOK_TOKEN=TheToken
JIRA_BASE_URL=https://jira.example.org
JIRA_USERNAME=jirauser
JIRA_PASSWORD=thepassword
```

#### b) Jira with P12/PFX

.env:
```
GITLAB_PERSONAL_ACCESS_TOKEN=jashdjsahdsjadsas
GITLAB_BASE_URL=https://git.example.org
GITLAB_WEBHOOK_TOKEN=TheToken
JIRA_PFX_PATH=./user_key.p12
JIRA_PFX_PASSWORD=ThePassword
JIRA_BASE_URL=https://jira.example.org
```

### Install Nodejs + Run the Service

```console
$ npm install
$ npm start
```

### Setup a Webhook in Gitlab

1. Set Url to http://example.org/events if your Webhook runs on http://example.org.
2. Set the token to something, which you will configured in `GITLAB_WEBHOOK_TOKEN`.

### That's it!

Now your merge requests should be visible whenever your reference a ticket with TEST-1234 at the
ticket.

## Tricky Implementation Details

- Jira: Jira shows only the last 5 (remote) links for an issue
  - Thus you shouldn't add to many merge requests to one Ticket
- Gitlab: If on first push the merge is conflicted: the merge event does not appear!
  - Thus we fetch the merge request again as soon as a pipeline finishes.

## License

This work is copyright by DracoBlue (<http://dracoblue.net>) and licensed under the terms of MIT License.
