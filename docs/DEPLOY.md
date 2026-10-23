# Deploying next to GitLab Omnibus

This guide runs the webhook as a Docker container on the same host as a GitLab Omnibus
installation, with GitLab calling it on `http://127.0.0.1:3000/events`. Other setups (separate
host, Kubernetes) work the same way with a different `WEBHOOK_URL` and network setup.

Everything happens in the `deploy/` directory:

| File | Purpose |
| --- | --- |
| `install.sh` | install, update, roll back, status, logs, uninstall |
| `register-hooks.sh` | create/update/remove the webhook on GitLab projects |
| `app.env.example` | container configuration (secrets) |
| `deploy.env.example` | settings of the two scripts |
| `projects.txt.example` | list of projects to hook |

Requirements on the host: Docker, bash, curl, and `jq` or `python3`.

## 1. Prepare credentials

**GitLab read token** (used by the container): create a bot user, or use an existing service
account, with at least Reporter access to every project you want to hook. Give it a personal
access token with scope `read_api`. A group access token with `read_api` works too.

**GitLab admin token** (used only by `register-hooks.sh`, never by the container): a token with
scope `api` of a user with Maintainer role on the projects. `--allow-local-target` additionally
requires an administrator. You can revoke it after registering the hooks.

**Jira Cloud API token**: log in to Atlassian as the account that should appear as the link author
(ideally a dedicated account) and create a token at
<https://id.atlassian.com/manage-profile/security/api-tokens>. The account needs **Browse projects**
and **Link issues** in the Jira projects. For an Atlassian *service account* with a scoped token,
set `JIRA_BASE_URL` to `https://api.atlassian.com/ex/jira/<cloud-id>` and grant the scopes for
reading users and writing issue remote links.

**Webhook secret**: `openssl rand -hex 32`.

## 2. Copy the deploy kit to the server

```console
$ git clone https://github.com/DracoBlue/gitlab-jira-webhook.git /opt/gitlab-jira-webhook
$ cd /opt/gitlab-jira-webhook/deploy
$ cp app.env.example app.env
$ cp deploy.env.example deploy.env
$ cp projects.txt.example projects.txt
$ chmod 600 app.env deploy.env
```

Only the `deploy/` directory is needed; copying just that is fine.

## 3. Configure

`app.env`: fill in the GitLab and Jira values. Setting `JIRA_PROJECT_KEYS` is recommended.

`deploy.env`:

- `IMAGE`: registry path **with an explicit version tag**, e.g.
  `registry.example.org/group/gitlab-jira-webhook:2.0.0`.
- `REGISTRY_USER` / `REGISTRY_TOKEN`: a deploy token with `read_registry`, unless the host is
  already logged in to the registry.
- `CA_CERT_FILE`: if the GitLab certificate is issued by a private CA, point this at the CA
  certificate (PEM). The container doesn't use the host trust store. Typical locations:
  `/etc/gitlab/trusted-certs/`, `/usr/local/share/ca-certificates/`, `/etc/pki/ca-trust/source/anchors/`.
  You can confirm the CA with
  `openssl s_client -connect git.example.org:443 -showcerts </dev/null` (look at the `i:` issuer line).
- `EXTRA_HOSTS`: if the GitLab host name only resolves on the host itself (`/etc/hosts`), add
  `git.example.org:host-gateway` so the container reaches the host's GitLab nginx.

`projects.txt`: one `group/project` (or numeric ID) per line.

## 4. Install

```console
$ sudo ./install.sh
==> pulling registry.example.org/group/gitlab-jira-webhook:2.0.0
==> starting gitlab-jira-webhook from registry.example.org/group/gitlab-jira-webhook:2.0.0
==> gitlab-jira-webhook is up on 127.0.0.1:3000
==> checking GitLab and Jira connectivity
OK   configuration
OK   icon map: 16 icons
OK   GitLab https://git.example.org: authenticated as jira-bot
OK   Jira https://example.atlassian.net: authenticated as GitLab Bot
```

The container restarts with Docker (`--restart unless-stopped`), so no systemd unit is needed.

If the connectivity check fails, the container keeps running, and the message tells you what's
wrong:

| Message | Fix |
| --- | --- |
| `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, `SELF_SIGNED_CERT_IN_CHAIN` | set `CA_CERT_FILE` |
| `ENOTFOUND`, `EAI_AGAIN` | set `EXTRA_HOSTS`, or check DNS |
| `ECONNREFUSED` towards GitLab | GitLab nginx not listening on that address; try `EXTRA_HOSTS` with the host's LAN IP |
| HTTP 401 from GitLab or Jira | wrong token or email |

Fix `app.env` or `deploy.env`, then run `./install.sh` again.

## 5. Allow GitLab to call a local address

GitLab refuses webhooks to `localhost` and private networks by default ("Requests to the local
network are not allowed"). Allow exactly the webhook's address:

- with the script (needs an admin token): `./register-hooks.sh --allow-local-target` (also
  registers the hooks), **or**
- by hand: *Admin → Settings → Network → Outbound requests → Local IP addresses and domain
  names that hooks and integrations can access*, add `127.0.0.1:3000`.

Prefer this allowlist over the broader "Allow requests to the local network from webhooks and
integrations" checkbox.

## 6. Register the project hooks

```console
$ ./register-hooks.sh --dry-run          # shows what would happen
$ ./register-hooks.sh                    # creates or updates the hooks
group/project: created hook
group/subgroup/another-project: created hook
```

Each hook gets *Merge request events* and *Pipeline events*, the secret token from `app.env`, and
SSL verification per `HOOK_SSL_VERIFY`. Re-running is safe: hooks are matched by URL and updated.
Add projects later by appending to `projects.txt` and running it again, or pass them directly:
`./register-hooks.sh group/new-project`. To remove: `./register-hooks.sh --remove [project ...]`.

## 7. Test

In GitLab, open a hooked project: *Settings → Webhooks → (hook) → Test → Merge request events*.
GitLab should report `HTTP 200`. Then open or update a merge request whose title, description or
branch mentions an issue (`PROJ-123`) and check the issue's web links in Jira. `./install.sh logs`
shows one `merge request synced` line per processed merge request, listing the linked issues.

## Updating

1. Publish the new image version to the registry.
2. Set the new tag in `deploy.env`: `IMAGE=registry.example.org/group/gitlab-jira-webhook:2.1.0`.
3. Run `sudo ./install.sh update`.

The update:

- pulls the image
- stops the running container and keeps it under the name `gitlab-jira-webhook-old`
- starts the new one and waits up to 30 s for it to answer on its port
- **if the new container doesn't start**, removes it and restarts the old one; the script exits
  with an error and nothing changed
- on success, removes the old container and tags its image locally as `gitlab-jira-webhook:previous`
  for rollback
- runs the connectivity check

The webhook is down for a few seconds. GitLab doesn't redeliver missed events, but the next event
of an affected merge request refreshes its links.

Running `./install.sh update` with the same tag re-pulls it, which picks up a re-pushed tag. It also
applies changes made to `app.env`.

## Rolling back

```console
$ sudo ./install.sh rollback
```

This starts the container from `gitlab-jira-webhook:previous`. Running it again switches back. Then
set `IMAGE` in `deploy.env` to the version that works, otherwise the next `update` installs the
broken one again. Any older version can also be installed by setting its tag in `IMAGE` and running
`update`.

## Operations

| Task | Command |
| --- | --- |
| state, version, rollback version | `./install.sh status` |
| follow the log | `./install.sh logs` (add `LOG_LEVEL=debug` to `app.env` and update for detail) |
| re-check credentials | `./install.sh check` |
| remove | `./install.sh uninstall` (keeps the config files), then `./register-hooks.sh --remove` |

GitLab shows every delivery with its response under *Settings → Webhooks → Edit → Recent events*.
If GitLab disabled a hook after repeated failures, fix the cause and re-enable it there. Sending a
test event does that.

## Images without a registry

On a host without registry access: `docker save` the image elsewhere, `docker load` it on the host,
set `PULL=false` in `deploy.env`, and run `./install.sh update` as usual.
