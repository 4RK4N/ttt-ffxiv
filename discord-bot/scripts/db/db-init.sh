#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

DB_PATH="data/ttt.db"
DB_CLI="dist/scripts/db/cli.js"
SERVICE="ttt-discord-bot"

CONFIG_FILE="data/config.json"
EXAMPLE_CONFIG="data/config.example.json"
SCHEMA="scripts/db/schema.sql"

FORCE=0
SEED_MODULES=1

usage() {
  cat >&2 <<EOF
Usage: $0 [--force] [--all-modules | --no-modules]

First-time Turso setup:
  1. Create data/ttt.db with base schema
  2. Apply per-module seed.sql files (unless --no-modules)
  3. Prompt for app secrets (app_config) when empty

  --force        Overwrite existing app_config rows
  --all-modules  Apply all module seeds (default)
  --no-modules   Skip module seed.sql files

Stops the bot if it is running, then restarts when finished.

Requires a built bot image: ./scripts/build.sh bot
EOF
}

prompt_secret() {
  local label="$1"
  local value=""
  read -rsp "${label}: " value
  echo
  printf '%s' "$value"
}

prompt_value() {
  local label="$1"
  local default="${2:-}"
  local value=""
  if [[ -n "$default" ]]; then
    read -rp "${label} [${default}]: " value
    printf '%s' "${value:-$default}"
  else
    read -rp "${label}: " value
    printf '%s' "$value"
  fi
}

run_bot_node() {
  docker compose run --rm --no-deps -T "$SERVICE" node "$@"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1 ;;
    --all-modules) SEED_MODULES=1 ;;
    --no-modules) SEED_MODULES=0 ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      usage
      exit 1
      ;;
  esac
  shift
done

mkdir -p data

if [[ ! -f "$CONFIG_FILE" ]]; then
  cp "$EXAMPLE_CONFIG" "$CONFIG_FILE"
  echo "Created $CONFIG_FILE from template."
fi

if [[ -f "$DB_PATH" ]]; then
  echo "Using existing $DB_PATH (schema/seed statements are idempotent)."
else
  echo "Creating $DB_PATH ..."
fi

stopped=0
if docker compose ps --status running -q "$SERVICE" 2>/dev/null | grep -q .; then
  echo "Stopping $SERVICE ..."
  docker compose stop "$SERVICE"
  stopped=1
fi

echo "Applying base schema..."
run_bot_node "$DB_CLI" apply-sql "$DB_PATH" "$SCHEMA"

if [[ "$SEED_MODULES" -eq 1 ]]; then
  seed_count=0
  for seed in discord-bot/shared/modules/*/seed.sql; do
    [[ -f "$seed" ]] || continue
    container_seed="${seed#discord-bot/}"
    echo "Applying $container_seed ..."
    run_bot_node "$DB_CLI" apply-sql "$DB_PATH" "$container_seed"
    seed_count=$((seed_count + 1))
  done
  if [[ "$seed_count" -eq 0 ]]; then
    echo "No shared/modules/*/seed.sql files in bot image. Rebuild: ./scripts/build.sh bot" >&2
    exit 1
  fi
  echo "Applied $seed_count module seed(s)."
else
  echo "Skipping module seeds (--no-modules)."
fi

app_count="$(run_bot_node "$DB_CLI" count-app-config "$DB_PATH" | tail -n1)"

if [[ "$app_count" == "0" || "$FORCE" -eq 1 ]]; then
  echo "Configure app settings (stored in app_config):"

  discord_token="$(prompt_secret "Discord bot token")"
  if [[ -z "$discord_token" ]]; then echo "discordToken is required." >&2; exit 1; fi

  client_id="$(prompt_value "Application / client ID")"
  if [[ -z "$client_id" ]]; then echo "clientId is required." >&2; exit 1; fi

  guild_id="$(prompt_value "Guild ID (optional, empty for global commands)" "")"

  bot_name="$(prompt_value "Bot display name" "TTT")"

  client_secret="$(prompt_secret "OAuth client secret")"
  if [[ -z "$client_secret" ]]; then echo "clientSecret is required." >&2; exit 1; fi

  session_secret="$(prompt_secret "Session secret (empty = auto-generate)")"

  oauth_redirect="$(prompt_value "OAuth redirect URI")"
  if [[ -z "$oauth_redirect" ]]; then echo "oauthRedirectUri is required." >&2; exit 1; fi

  web_port="$(prompt_value "Web editor port" "8088")"

  docker compose run --rm --no-deps -T \
    -e "TTT_DISCORD_TOKEN=${discord_token}" \
    -e "TTT_CLIENT_ID=${client_id}" \
    -e "TTT_GUILD_ID=${guild_id}" \
    -e "TTT_BOT_NAME=${bot_name}" \
    -e "TTT_CLIENT_SECRET=${client_secret}" \
    -e "TTT_SESSION_SECRET=${session_secret}" \
    -e "TTT_OAUTH_REDIRECT_URI=${oauth_redirect}" \
    -e "TTT_WEB_PORT=${web_port}" \
    "$SERVICE" node "$DB_CLI" write-app-config

  echo "app_config populated."
else
  echo "app_config already has ${app_count} row(s) — skipping prompts (use --force to overwrite)."
fi

echo "Table summary:"
run_bot_node "$DB_CLI" table-counts "$DB_PATH"

if [[ $stopped -eq 1 ]]; then
  echo "Restarting $SERVICE ..."
  docker compose up -d "$SERVICE"
fi

echo "Done. Build and start the combined app with: ./scripts/build.sh bot"
