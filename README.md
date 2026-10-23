# GitLab Jira Webhook

Shows GitLab merge requests on the Jira Cloud issues they mention, as web links with the current
state: open, draft, needs rebase, pipeline running/failed, merged, closed.

In Jira it looks like this:

![Screenshot](./screenshot.png)

A merge request is linked to every issue key (`PROJ-123`) found in its source branch, title or
description. Each link is updated in place whenever the merge request or its pipeline changes.

Version 2 is a modernization: Node 24, current GitLab and Jira Cloud APIs, no crash on API errors,
verified TLS. See [docs/DESIGN.md](docs/DESIGN.md) for how it works and what changed, and
[Upgrading from 1.x](#upgrading-from-1x) below.

## Quick start

1. Create an Atlassian API token for the Jira account that should create the links
   (<https://id.atlassian.com/manage-profile/security/api-tokens>). The account needs *Browse
   projects* and *Link issues*.
2. Create a GitLab token with `read_api` that can see the projects.
3. Configure, e.g. in `.env`:

   ```
   GITLAB_BASE_URL=https://git.example.org
   GITLAB_TOKEN=glpat-...
   GITLAB_WEBHOOK_TOKEN=<random secret>
   JIRA_BASE_URL=https://example.atlassian.net
   JIRA_EMAIL=gitlab-bot@example.org
   JIRA_API_TOKEN=...
   JIRA_PROJECT_KEYS=PROJ,OPS
   ```

   All options are in [deploy/app.env.example](deploy/app.env.example) and
   [docs/DESIGN.md](docs/DESIGN.md#configuration).
4. Run it:

   ```console
   $ docker build -t gitlab-jira-webhook .
   $ docker run --rm --env-file .env -p 3000:3000 gitlab-jira-webhook
   ```

   or without Docker (Node 24+): `npm ci && npm start`. Then `npm run check` verifies the
   credentials.
5. In GitLab, add a project webhook: URL `https://<host>/events`, secret token =
   `GITLAB_WEBHOOK_TOKEN`, triggers *Merge request events* and *Pipeline events*.

To run it next to a GitLab Omnibus installation (install, register hooks on many projects, update,
roll back), see [docs/DEPLOY.md](docs/DEPLOY.md).

## Upgrading from 1.x

- Jira Cloud only: `JIRA_USERNAME`/`JIRA_PASSWORD` become `JIRA_EMAIL`/`JIRA_API_TOKEN` (an API
  token, not the password). The old names still work and log a deprecation warning.
- `GITLAB_PERSONAL_ACCESS_TOKEN` is now `GITLAB_TOKEN` (old name still works).
- `JIRA_PFX_*` are removed. `JIRA_HTTPS_PROXY` is replaced by `HTTPS_PROXY` + `NODE_USE_ENV_PROXY=1`.
- TLS is verified. For a GitLab with a private CA set `NODE_EXTRA_CA_CERTS`.
- `ICON_URL_PATH` (directory) became `ICON_URL_MAP_PATH` (file). `STORE_EVENTS` became `STORE_EVENTS_DIR`.
- Existing links are updated, not duplicated: the link id format is unchanged.

## Development

```console
$ npm ci
$ npm test          # node:test, no external services needed
$ npm run dev       # restarts on changes, reads .env
```

## License

This work is copyright by DracoBlue (<http://dracoblue.net>) and licensed under the terms of MIT
License, see [LICENSE](LICENSE).
