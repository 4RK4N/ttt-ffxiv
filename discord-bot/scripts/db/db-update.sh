#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

DB_PATH="data/ttt.db"
DB_CLI="dist/scripts/db/cli.js"
SERVICE="ttt-discord-bot"

usage() {
  cat >&2 <<EOF
Usage: $0 <migration.sql>

Apply an incremental SQL migration to data/ttt.db.
Stops the bot if it is running, applies SQL, then restarts.

Example:
  $0 scripts/db/migrations/001_example.sql

Requires a built bot image: ./scripts/build.sh bot
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

migration="${1:-}"
if [[ -z "$migration" || ! -f "$migration" ]]; then
  echo "Migration file not found: ${migration:-<missing>}" >&2
  usage
  exit 1
fi

if [[ ! -f "$DB_PATH" ]]; then
  echo "$DB_PATH not found. Run ./scripts/db/db-init.sh first." >&2
  exit 1
fi

migration_abs="$(cd "$(dirname "$migration")" && pwd)/$(basename "$migration")"

stopped=0
if docker compose ps --status running -q "$SERVICE" 2>/dev/null | grep -q .; then
  echo "Stopping $SERVICE ..."
  docker compose stop "$SERVICE"
  stopped=1
fi

echo "Applying $migration to $DB_PATH ..."
docker compose run --rm --no-deps -T \
  -v "${migration_abs}:/app/migration.sql:ro" \
  "$SERVICE" node "$DB_CLI" apply-sql "$DB_PATH" /app/migration.sql

if [[ $stopped -eq 1 ]]; then
  echo "Restarting $SERVICE ..."
  docker compose up -d "$SERVICE"
fi

echo "Done."
