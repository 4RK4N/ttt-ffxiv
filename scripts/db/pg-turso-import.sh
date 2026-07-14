#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

DB_PATH="data/ttt.db"
IMPORT_CLI="dist/scripts/db/pg-turso-import.js"
SERVICE="ttt-discord-bot"

usage() {
  cat >&2 <<EOF
Usage: $0 <pg-dump.sql>

One-time import from pg_dump --column-inserts into $DB_PATH.
Upserts production app_config + module rows; keeps existing editorConfig seeds.

Requires:
  - Built bot image: ./scripts/build.sh bot
  - Existing $DB_PATH with tables (./scripts/db/db-init.sh if missing)

Example:
  $0 backups/ttt-pre-turso.sql
EOF
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

if [[ ! -f "$DB_PATH" ]]; then
  echo "$DB_PATH not found. Run ./scripts/db/db-init.sh first." >&2
  exit 1
fi

dump_abs="$(cd "$(dirname "$dump")" && pwd)/$(basename "$dump")"

echo "Importing $dump into $DB_PATH ..."
echo "Clearing stale WAL (if any) ..."
rm -f data/ttt.db-wal data/ttt.db-shm

docker compose run --rm --no-deps \
  -v "${dump_abs}:/app/import.dump:ro" \
  "$SERVICE" node "$IMPORT_CLI" /app/import.dump "$DB_PATH"

echo "Done. Verify row counts above, then: docker compose up -d ttt-discord-bot"
