#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

DB_PATH="data/ttt.db"
INIT_SCRIPT="scripts/db/db-init-turso.sh"
IMPORT_CLI="dist/scripts/db/pg-turso-import.js"
SERVICE="ttt-discord-bot"

usage() {
  cat >&2 <<EOF
Usage: $0 <pg-dump.sql>

Import production rows from a pg_dump --column-inserts file into $DB_PATH.
Creates and seeds the DB first if $DB_PATH is missing.

Example:
  $0 backups/ttt-pre-turso.sql

Requires a built bot image: ./scripts/build.sh bot
EOF
}

run_bot_node() {
  docker compose run --rm --no-deps "$SERVICE" node "$@"
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

dump="${1:-}"
if [[ -z "$dump" || ! -f "$dump" ]]; then
  echo "Dump file not found: ${dump:-<missing>}" >&2
  usage
  exit 1
fi

dump_abs="$(cd "$(dirname "$dump")" && pwd)/$(basename "$dump")"

if [[ ! -f "$DB_PATH" ]]; then
  echo "$DB_PATH not found — running db-init-turso.sh first..."
  "$INIT_SCRIPT"
fi

echo "Importing $dump into $DB_PATH ..."
docker compose run --rm --no-deps \
  -v "${dump_abs}:/app/import.dump:ro" \
  "$SERVICE" node "$IMPORT_CLI" /app/import.dump "$DB_PATH"
echo "Done. Verify row counts above, then proceed to phase 4."
