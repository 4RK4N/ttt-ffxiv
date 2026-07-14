#!/usr/bin/env bash
# Shared docker compose helpers for DB scripts.
# Source from scripts/db/*.sh after setting SERVICE and DB_CLI if needed.

: "${SERVICE:=ttt-discord-bot}"
: "${DB_CLI:=dist/scripts/db/cli.js}"

_WRITE_SESSION=0
_WRITE_STOPPED=0

_COMPOSE_RUN_SUPPORTS_NO_BUILD=
_compose_run_supports_no_build() {
  if [[ -n "$_COMPOSE_RUN_SUPPORTS_NO_BUILD" ]]; then
    [[ "$_COMPOSE_RUN_SUPPORTS_NO_BUILD" == "1" ]]
    return
  fi
  if docker compose run --help 2>&1 | grep -q -- '--no-build'; then
    _COMPOSE_RUN_SUPPORTS_NO_BUILD=1
  else
    _COMPOSE_RUN_SUPPORTS_NO_BUILD=0
  fi
  [[ "$_COMPOSE_RUN_SUPPORTS_NO_BUILD" == "1" ]]
}

# docker compose run node "$@" — skips rebuild when compose supports --no-build.
_compose_run_node() {
  local -a cmd=(docker compose run --rm --no-deps -T)
  if _compose_run_supports_no_build; then
    cmd+=(--no-build)
  fi
  cmd+=("$SERVICE" node "$@")
  "${cmd[@]}"
}

_bot_is_running() {
  docker compose ps --status running -q "$SERVICE" 2>/dev/null | grep -q .
}

# Read-only CLI work (dump, counts): exec into the running bot, else one-off run.
bot_node() {
  if _bot_is_running; then
    docker compose exec -T "$SERVICE" node "$@"
  else
    _compose_run_node "$@"
  fi
}

# One-off container run (no stop/start); use inside a write session.
bot_node_run() {
  _compose_run_node "$@"
}

bot_node_write_begin() {
  if [[ $_WRITE_SESSION -eq 1 ]]; then
    return 0
  fi
  _WRITE_SESSION=1
  if _bot_is_running; then
    echo "Stopping $SERVICE for database write ..."
    docker compose stop "$SERVICE" >/dev/null
    _WRITE_STOPPED=1
  fi
}

bot_node_write_end() {
  if [[ $_WRITE_SESSION -eq 0 ]]; then
    return 0
  fi
  _WRITE_SESSION=0
  if [[ $_WRITE_STOPPED -eq 1 ]]; then
    echo "Restarting $SERVICE ..."
    docker compose up -d "$SERVICE" >/dev/null
    _WRITE_STOPPED=0
  fi
}

# Single write command: stop bot if needed, run, restart.
bot_node_write() {
  bot_node_write_begin
  bot_node_run "$@"
  local rc=$?
  bot_node_write_end
  return $rc
}

# write-app-config with TTT_* env vars (-e flags before node args).
bot_node_write_env() {
  local -a env_flags=()
  while [[ $# -gt 0 && "$1" == -e ]]; do
    env_flags+=("$1" "$2")
    shift 2
  done

  bot_node_write_begin
  local -a cmd=(docker compose run --rm --no-deps -T)
  if _compose_run_supports_no_build; then
    cmd+=(--no-build)
  fi
  cmd+=("${env_flags[@]}" "$SERVICE" node "$@")
  "${cmd[@]}"
  local rc=$?
  bot_node_write_end
  return $rc
}

# Multiple writes in one stop/start cycle (db-init).
bot_node_write_session() {
  bot_node_write_begin
  "$@"
  local rc=$?
  bot_node_write_end
  return $rc
}
