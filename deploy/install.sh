#!/usr/bin/env bash
# Installs, updates and rolls back the gitlab-jira-webhook container.
#
#   ./install.sh [install|update]  pull IMAGE and (re)create the container (default)
#   ./install.sh rollback          go back to the image that ran before the last update
#   ./install.sh status            show container, image and health
#   ./install.sh check             re-run the GitLab/Jira connectivity check
#   ./install.sh logs              follow the container log
#   ./install.sh uninstall         remove the container (config files are kept)
#
# Reads deploy.env and app.env from this directory (override with DEPLOY_ENV / APP_ENV).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ENV="${DEPLOY_ENV:-$SCRIPT_DIR/deploy.env}"
APP_ENV="${APP_ENV:-$SCRIPT_DIR/app.env}"

die() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "==> $*"; }

[[ -f "$DEPLOY_ENV" ]] || die "$DEPLOY_ENV not found; copy deploy.env.example and fill it in"
# shellcheck source=deploy.env.example
source "$DEPLOY_ENV"

: "${IMAGE:?IMAGE must be set in $DEPLOY_ENV}"
CONTAINER_NAME="${CONTAINER_NAME:-gitlab-jira-webhook}"
HOST_BIND="${HOST_BIND:-127.0.0.1}"
HOST_PORT="${HOST_PORT:-3000}"
MEMORY_LIMIT="${MEMORY_LIMIT:-256m}"
PREVIOUS_TAG="$CONTAINER_NAME:previous"
OLD_NAME="$CONTAINER_NAME-old"

command -v docker >/dev/null || die "docker is not installed"
command -v curl >/dev/null || die "curl is not installed"

container_exists() { docker container inspect "$1" >/dev/null 2>&1; }

preflight() {
    [[ -f "$APP_ENV" ]] || die "$APP_ENV not found; copy app.env.example and fill it in"
    if [[ -n "$(find "$APP_ENV" -perm /o+r)" ]]; then
        echo "WARNING: $APP_ENV is world-readable and contains secrets; run: chmod 600 $APP_ENV" >&2
    fi
    if [[ -n "${CA_CERT_FILE:-}" && ! -r "$CA_CERT_FILE" ]]; then
        die "CA_CERT_FILE $CA_CERT_FILE is not readable"
    fi
}

registry_login() {
    if [[ -n "${REGISTRY_USER:-}" && -n "${REGISTRY_TOKEN:-}" ]]; then
        local registry="${IMAGE%%/*}"
        info "logging in to $registry"
        printf '%s' "$REGISTRY_TOKEN" | docker login "$registry" --username "$REGISTRY_USER" --password-stdin >/dev/null
    fi
}

# Starts a new container from the given image. Fails if the name is taken.
run_container() {
    local image="$1"
    local args=(
        --detach
        --name "$CONTAINER_NAME"
        --restart unless-stopped
        --env-file "$APP_ENV"
        --env PORT=3000
        --publish "$HOST_BIND:$HOST_PORT:3000"
        --read-only
        --cap-drop ALL
        --security-opt no-new-privileges:true
        --memory "$MEMORY_LIMIT"
    )
    if [[ -n "${CA_CERT_FILE:-}" ]]; then
        args+=(--volume "$CA_CERT_FILE:/etc/ssl/certs/extra-ca.pem:ro" --env NODE_EXTRA_CA_CERTS=/etc/ssl/certs/extra-ca.pem)
    fi
    local host
    for host in ${EXTRA_HOSTS:-}; do
        args+=(--add-host "$host")
    done
    if [[ "$(docker info --format '{{.LoggingDriver}}')" == "json-file" ]]; then
        args+=(--log-opt max-size=10m --log-opt max-file=3)
    fi
    docker run "${args[@]}" "$image" >/dev/null
}

# Waits until the container answers on its port; fails if it stops or times out.
wait_ready() {
    local probe_host="$HOST_BIND"
    if [[ "$probe_host" == "0.0.0.0" ]]; then probe_host=127.0.0.1; fi
    local url="http://$probe_host:$HOST_PORT/"
    local _
    for _ in $(seq 1 30); do
        if [[ "$(docker container inspect --format '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null)" != "true" ]]; then
            return 1
        fi
        if curl --silent --fail --max-time 2 "$url" >/dev/null; then
            return 0
        fi
        sleep 1
    done
    return 1
}

connectivity_check() {
    info "checking GitLab and Jira connectivity"
    if ! docker exec "$CONTAINER_NAME" node src/check.js; then
        echo "WARNING: connectivity check failed. The container keeps running; fix app.env (or CA_CERT_FILE / EXTRA_HOSTS) and run: $0 update" >&2
        return 2
    fi
}

# Replaces the running container with one from $1, keeping the old one until the new one is ready.
replace_container() {
    local image="$1"
    local had_old=false

    if container_exists "$OLD_NAME"; then docker rm --force "$OLD_NAME" >/dev/null; fi
    if container_exists "$CONTAINER_NAME"; then
        had_old=true
        docker stop "$CONTAINER_NAME" >/dev/null
        docker rename "$CONTAINER_NAME" "$OLD_NAME"
    fi

    info "starting $CONTAINER_NAME from $image"
    if run_container "$image" && wait_ready; then
        if $had_old; then
            docker rm "$OLD_NAME" >/dev/null
        fi
        info "$CONTAINER_NAME is up on $HOST_BIND:$HOST_PORT"
        return 0
    fi

    echo "ERROR: new container did not become ready; last log lines:" >&2
    docker logs --tail 30 "$CONTAINER_NAME" >&2 2>&1 || true
    docker rm --force "$CONTAINER_NAME" >/dev/null 2>&1 || true
    if $had_old; then
        info "restoring the previous container"
        docker rename "$OLD_NAME" "$CONTAINER_NAME"
        docker start "$CONTAINER_NAME" >/dev/null
    fi
    return 1
}

cmd_update() {
    preflight
    if [[ "${PULL:-true}" == "true" ]]; then
        registry_login
        info "pulling $IMAGE"
        docker pull "$IMAGE" >/dev/null
    else
        docker image inspect "$IMAGE" >/dev/null 2>&1 || die "PULL=false but $IMAGE is not present locally"
    fi

    local new_id current_id=""
    new_id="$(docker image inspect --format '{{.Id}}' "$IMAGE")"
    if container_exists "$CONTAINER_NAME"; then
        current_id="$(docker container inspect --format '{{.Image}}' "$CONTAINER_NAME")"
    fi

    replace_container "$IMAGE" || die "update failed, the previous container is still running"

    # Remember the image we moved away from, so `rollback` can return to it.
    # A local tag also keeps `docker image prune` from deleting it.
    if [[ -n "$current_id" && "$current_id" != "$new_id" ]]; then
        docker tag "$current_id" "$PREVIOUS_TAG"
        info "previous image kept as $PREVIOUS_TAG"
    fi
    connectivity_check
}

cmd_rollback() {
    preflight
    docker image inspect "$PREVIOUS_TAG" >/dev/null 2>&1 || die "no previous image ($PREVIOUS_TAG) to roll back to"
    local current_id
    current_id="$(docker container inspect --format '{{.Image}}' "$CONTAINER_NAME" 2>/dev/null || true)"

    replace_container "$PREVIOUS_TAG" || die "rollback failed, the current container is still running"

    # Swap, so a second rollback returns to where we started.
    if [[ -n "$current_id" ]]; then
        docker tag "$current_id" "$PREVIOUS_TAG"
    fi
    echo "NOTE: rolled back. Pin IMAGE in $DEPLOY_ENV to the working version, or the next update re-installs $IMAGE." >&2
    connectivity_check
}

cmd_status() {
    if ! container_exists "$CONTAINER_NAME"; then
        echo "$CONTAINER_NAME is not installed"
        return 0
    fi
    docker container inspect --format \
        'name:    {{.Name}}
image:   {{.Config.Image}}
version: {{index .Config.Labels "org.opencontainers.image.version"}}
state:   {{.State.Status}} (started {{.State.StartedAt}})
health:  {{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' "$CONTAINER_NAME"
    if docker image inspect "$PREVIOUS_TAG" >/dev/null 2>&1; then
        echo "rollback: $(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.version"}}' "$PREVIOUS_TAG")"
    fi
}

cmd_uninstall() {
    if container_exists "$OLD_NAME"; then docker rm --force "$OLD_NAME" >/dev/null; fi
    if container_exists "$CONTAINER_NAME"; then
        docker rm --force "$CONTAINER_NAME" >/dev/null
        info "removed $CONTAINER_NAME"
    fi
    if docker image inspect "$PREVIOUS_TAG" >/dev/null 2>&1; then
        docker rmi "$PREVIOUS_TAG" >/dev/null
    fi
    info "config files in $SCRIPT_DIR were kept"
}

case "${1:-install}" in
    install | update) cmd_update ;;
    rollback) cmd_rollback ;;
    status) cmd_status ;;
    check) connectivity_check ;;
    logs) docker logs --follow --tail 100 "$CONTAINER_NAME" ;;
    uninstall) cmd_uninstall ;;
    -h | --help | help) sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//' ;;
    *) die "unknown command '$1' (see --help)" ;;
esac
