#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

DB_PATH="data/ttt.db"
SCHEMA="scripts/db/schema-turso.sql"
APPLY_SQL="dist/scripts/db/apply-sql.js"
SERVICE="ttt-discord-bot"

usage() {
  cat >&2 <<EOF
Usage: $0

Create data/ttt.db with Turso base schema and per-module seed.sql files.
Does not import production data — run pg-turso-import.sh after this.

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

if [[ -n "${1:-}" ]]; then
  usage
  exit 1
fi

mkdir -p data

if [[ -f "$DB_PATH" ]]; then
  echo "Using existing $DB_PATH (schema/seed statements are idempotent)."
else
  echo "Creating $DB_PATH ..."
fi

echo "Applying base schema..."
run_bot_node "$APPLY_SQL" "$DB_PATH" "$SCHEMA"

seed_count=0
for seed in shared/modules/*/seed.sql; do
  [[ -f "$seed" ]] || continue
  echo "Applying $seed ..."
  run_bot_node "$APPLY_SQL" "$DB_PATH" "$seed"
  seed_count=$((seed_count + 1))
done

if [[ "$seed_count" -eq 0 ]]; then
  echo "No shared/modules/*/seed.sql files in bot image. Rebuild: ./scripts/build.sh bot" >&2
  exit 1
fi

echo "Done. $DB_PATH has base schema + $seed_count module seed(s)."
echo "Next: ./scripts/db/pg-turso-import.sh <your-pg-dump.sql>"
