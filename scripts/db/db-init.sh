#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

wait_for_postgres() {
  echo "Waiting for PostgreSQL..."
  for _ in $(seq 1 30); do
    if docker compose exec -T ttt-postgres pg_isready -U ttt -d ttt >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "PostgreSQL is not healthy. Start it with: docker compose up -d ttt-postgres" >&2
  return 1
}

FORCE=0
CONFIG_FILE="data/config.json"
EXAMPLE_CONFIG="data/config.example.json"
SCHEMA="scripts/db/schema.sql"
DB_CLI="dist/scripts/db/cli.js"

usage() {
  cat >&2 <<EOF
Usage: $0 [--force]

First-time PostgreSQL setup:
  1. Start ttt-postgres and apply schema
  2. Prompt for app secrets (app_config) when empty
  3. Seed module tables from code defaults when empty

  --force  Overwrite existing app_config / module rows

Requires a built bot image for seed/write steps: ./scripts/build.sh bot
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

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ -n "${1:-}" && "${1:-}" != "--force" ]]; then
  usage
  exit 1
fi

if [[ "${1:-}" == "--force" ]]; then
  FORCE=1
fi

mkdir -p data postgres-data

if [[ ! -f "$CONFIG_FILE" ]]; then
  cp "$EXAMPLE_CONFIG" "$CONFIG_FILE"
  echo "Created $CONFIG_FILE from template."
fi

echo "Starting ttt-postgres..."
docker compose up -d ttt-postgres
wait_for_postgres

echo "Applying schema..."
docker compose exec -T ttt-postgres psql -U ttt -d ttt -v ON_ERROR_STOP=1 -f - < "$SCHEMA"

app_count="$(docker compose exec -T ttt-postgres psql -U ttt -d ttt -Atqc "SELECT COUNT(*) FROM app_config")"

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

  internal_secret="$(prompt_secret "Internal API secret (empty = auto-generate)")"

  web_port="$(prompt_value "Web editor port" "8088")"
  internal_port="$(prompt_value "Internal API port" "8087")"
  internal_bind="$(prompt_value "Internal API bind" "0.0.0.0")"
  bot_api_url="$(prompt_value "Bot internal API URL" "http://ttt-discord-bot:8087")"

  docker compose run --rm --no-deps \
    -e "TTT_DISCORD_TOKEN=${discord_token}" \
    -e "TTT_CLIENT_ID=${client_id}" \
    -e "TTT_GUILD_ID=${guild_id}" \
    -e "TTT_BOT_NAME=${bot_name}" \
    -e "TTT_CLIENT_SECRET=${client_secret}" \
    -e "TTT_SESSION_SECRET=${session_secret}" \
    -e "TTT_OAUTH_REDIRECT_URI=${oauth_redirect}" \
    -e "TTT_INTERNAL_API_SECRET=${internal_secret}" \
    -e "TTT_WEB_PORT=${web_port}" \
    -e "TTT_INTERNAL_API_PORT=${internal_port}" \
    -e "TTT_INTERNAL_API_BIND=${internal_bind}" \
    -e "TTT_BOT_INTERNAL_API_URL=${bot_api_url}" \
    ttt-discord-bot node "$DB_CLI" write-app-config

  echo "app_config populated."
else
  echo "app_config already has ${app_count} row(s) — skipping prompts (use --force to overwrite)."
fi

echo "Seeding module tables from code defaults..."
if [[ "$FORCE" -eq 1 ]]; then
  docker compose run --rm --no-deps ttt-discord-bot node "$DB_CLI" seed --force
else
  docker compose run --rm --no-deps ttt-discord-bot node "$DB_CLI" seed
fi

echo "Table summary:"
docker compose exec -T ttt-postgres psql -U ttt -d ttt -c \
  "SELECT 'app_config' AS table, COUNT(*) FROM app_config
   UNION ALL SELECT 'module_welcome_message', COUNT(*) FROM module_welcome_message
   UNION ALL SELECT 'module_pic_repost_commands', COUNT(*) FROM module_pic_repost_commands
   UNION ALL SELECT 'module_links_pics_vids_autothread', COUNT(*) FROM module_links_pics_vids_autothread
   UNION ALL SELECT 'module_tickets', COUNT(*) FROM module_tickets
   UNION ALL SELECT 'module_reaction_roles', COUNT(*) FROM module_reaction_roles
   UNION ALL SELECT 'module_custom_embeds', COUNT(*) FROM module_custom_embeds
   UNION ALL SELECT 'module_moderation_log', COUNT(*) FROM module_moderation_log
   UNION ALL SELECT 'module_emojis', COUNT(*) FROM module_emojis;"

echo "Done. Build and start bot and web editor with: ./scripts/build.sh bot web-editor"
