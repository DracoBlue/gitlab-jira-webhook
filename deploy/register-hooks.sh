#!/usr/bin/env bash
# Creates or updates the webhook on each GitLab project listed in PROJECTS_FILE.
# Re-running is safe: a hook with the same URL is updated instead of duplicated.
#
#   ./register-hooks.sh [--dry-run] [--remove] [--allow-local-target] [project ...]
#
#   --dry-run             show what would change, change nothing
#   --remove              delete the hook from the projects instead
#   --allow-local-target  add the host:port of WEBHOOK_URL to GitLab's outbound-request
#                         allowlist (admin token needed); required when WEBHOOK_URL points
#                         to localhost or a private address
#   project ...           projects to process instead of PROJECTS_FILE
#
# Reads deploy.env (GITLAB_ADMIN_TOKEN, WEBHOOK_URL, PROJECTS_FILE, HOOK_SSL_VERIFY, CA_CERT_FILE) and
# app.env (GITLAB_BASE_URL, GITLAB_WEBHOOK_TOKEN) from this directory.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ENV="${DEPLOY_ENV:-$SCRIPT_DIR/deploy.env}"
APP_ENV="${APP_ENV:-$SCRIPT_DIR/app.env}"

die() { echo "ERROR: $*" >&2; exit 1; }

DRY_RUN=false
REMOVE=false
ALLOW_LOCAL=false
PROJECTS=()
for arg in "$@"; do
    case "$arg" in
        --dry-run) DRY_RUN=true ;;
        --remove) REMOVE=true ;;
        --allow-local-target) ALLOW_LOCAL=true ;;
        -h | --help) sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        -*) die "unknown option $arg" ;;
        *) PROJECTS+=("$arg") ;;
    esac
done

[[ -f "$DEPLOY_ENV" ]] || die "$DEPLOY_ENV not found"
[[ -f "$APP_ENV" ]] || die "$APP_ENV not found"
# shellcheck source=deploy.env.example
source "$DEPLOY_ENV"

# app.env is in docker env-file format (no quoting), so read single values instead of sourcing it.
app_env_value() { sed -n "s/^$1=//p" "$APP_ENV" | tail -n 1; }
GITLAB_BASE_URL="$(app_env_value GITLAB_BASE_URL)"
GITLAB_BASE_URL="${GITLAB_BASE_URL%/}"
GITLAB_WEBHOOK_TOKEN="$(app_env_value GITLAB_WEBHOOK_TOKEN)"

: "${GITLAB_BASE_URL:?GITLAB_BASE_URL missing in $APP_ENV}"
: "${GITLAB_WEBHOOK_TOKEN:?GITLAB_WEBHOOK_TOKEN missing in $APP_ENV}"
: "${GITLAB_ADMIN_TOKEN:?GITLAB_ADMIN_TOKEN missing in $DEPLOY_ENV}"
: "${WEBHOOK_URL:?WEBHOOK_URL missing in $DEPLOY_ENV}"
HOOK_SSL_VERIFY="${HOOK_SSL_VERIFY:-true}"

command -v curl >/dev/null || die "curl is not installed"
if command -v jq >/dev/null; then
    JSON=jq
elif command -v python3 >/dev/null; then
    JSON=python3
else
    die "jq or python3 is required"
fi

# Secrets go through files, not command-line arguments, so they don't show up in `ps`.
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
chmod 700 "$TMP_DIR"
printf 'header = "PRIVATE-TOKEN: %s"\n' "$GITLAB_ADMIN_TOKEN" > "$TMP_DIR/curl.conf"
# Same CA bundle as the container uses, for a GitLab certificate from a private CA.
if [[ -n "${CA_CERT_FILE:-}" ]]; then
    [[ -r "$CA_CERT_FILE" ]] || die "CA_CERT_FILE $CA_CERT_FILE is not readable"
    printf 'cacert = "%s"\n' "$CA_CERT_FILE" >> "$TMP_DIR/curl.conf"
fi
printf '%s' "$GITLAB_WEBHOOK_TOKEN" > "$TMP_DIR/hook-token"

api() {
    local method="$1" path="$2"
    shift 2
    curl --silent --show-error --fail-with-body --config "$TMP_DIR/curl.conf" \
        --request "$method" "$GITLAB_BASE_URL/api/v4$path" "$@"
}

# Prints the id of the hook whose URL equals WEBHOOK_URL, read from a hook list on stdin.
find_hook_id() {
    if [[ "$JSON" == jq ]]; then
        jq -r --arg url "$WEBHOOK_URL" 'map(select(.url == $url)) | first | .id // empty'
    else
        python3 -c 'import json, sys
url = sys.argv[1]
print(next((str(h["id"]) for h in json.load(sys.stdin) if h.get("url") == url), ""))' "$WEBHOOK_URL"
    fi
}

# Prints the outbound allowlist, one entry per line, from application settings on stdin.
allowlist_entries() {
    if [[ "$JSON" == jq ]]; then
        jq -r '.outbound_local_requests_whitelist // [] | .[]'
    else
        python3 -c 'import json, sys
print("\n".join(json.load(sys.stdin).get("outbound_local_requests_whitelist") or []))'
    fi
}

allow_local_target() {
    local target="${WEBHOOK_URL#*://}"
    target="${target%%/*}"
    local entries
    entries="$(api GET /application/settings | allowlist_entries)"
    if grep -qxF "$target" <<<"$entries"; then
        echo "allowlist: $target already allowed"
        return
    fi
    if $DRY_RUN; then
        echo "allowlist: would add $target"
        return
    fi
    local args=() entry
    while IFS= read -r entry; do
        if [[ -n "$entry" ]]; then args+=(--data-urlencode "outbound_local_requests_whitelist[]=$entry"); fi
    done <<<"$entries"
    args+=(--data-urlencode "outbound_local_requests_whitelist[]=$target")
    api PUT /application/settings "${args[@]}" >/dev/null
    echo "allowlist: added $target"
}

process_project() {
    local project="$1"
    local id="${project//\//%2F}"
    local hooks hook_id
    if ! hooks="$(api GET "/projects/$id/hooks")"; then
        echo "$project: cannot read hooks, see the error above (404/403: wrong path or token lacks Maintainer role)" >&2
        return 1
    fi
    hook_id="$(find_hook_id <<<"$hooks")"

    if $REMOVE; then
        if [[ -z "$hook_id" ]]; then
            echo "$project: no hook to remove"
        elif $DRY_RUN; then
            echo "$project: would remove hook $hook_id"
        else
            api DELETE "/projects/$id/hooks/$hook_id" >/dev/null
            echo "$project: removed hook $hook_id"
        fi
        return
    fi

    local settings=(
        --data-urlencode "url=$WEBHOOK_URL"
        --data-urlencode "token@$TMP_DIR/hook-token"
        --data "merge_requests_events=true"
        --data "pipeline_events=true"
        --data "push_events=false"
        --data "enable_ssl_verification=$HOOK_SSL_VERIFY"
    )
    if [[ -n "$hook_id" ]]; then
        if $DRY_RUN; then
            echo "$project: would update hook $hook_id"
        else
            api PUT "/projects/$id/hooks/$hook_id" "${settings[@]}" >/dev/null
            echo "$project: updated hook $hook_id"
        fi
    elif $DRY_RUN; then
        echo "$project: would create hook"
    else
        api POST "/projects/$id/hooks" "${settings[@]}" >/dev/null
        echo "$project: created hook"
    fi
}

if [[ ${#PROJECTS[@]} -eq 0 ]]; then
    PROJECTS_FILE="${PROJECTS_FILE:-projects.txt}"
    [[ "$PROJECTS_FILE" == /* ]] || PROJECTS_FILE="$SCRIPT_DIR/$PROJECTS_FILE"
    [[ -f "$PROJECTS_FILE" ]] || die "$PROJECTS_FILE not found; list projects there or pass them as arguments"
    while IFS= read -r line; do
        line="${line%%#*}"
        line="${line//[[:space:]]/}"
        if [[ -n "$line" ]]; then PROJECTS+=("$line"); fi
    done <"$PROJECTS_FILE"
fi

if $DRY_RUN; then echo "(dry run, nothing will be changed)"; fi
if $ALLOW_LOCAL; then allow_local_target; fi

failures=0
for project in "${PROJECTS[@]}"; do
    process_project "$project" || failures=$((failures + 1))
done
[[ $failures -eq 0 ]] || die "$failures project(s) failed"
