#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

DB_PATH="data/ttt.db"
DB_CLI="dist/scripts/db/cli.js"
SERVICE="ttt-discord-bot"

usage() {
  cat >&2 <<EOF
Usage: $0 <output.sql>

Dump data/ttt.db to a plain SQL file (CREATE TABLE + INSERT statements).
Uses a read-only Turso connection so the bot can keep running.

Example:
  $0 backups/ttt-$(date +%F).sql

If locking still fails, stop the bot first:
  docker compose stop ttt-discord-bot

Requires a built bot image: ./scripts/build.sh bot
EOF
}

run_dump() {
  if docker compose ps --status running -q "$SERVICE" 2>/dev/null | grep -q .; then
    docker compose exec -T "$SERVICE" node "$DB_CLI" dump-db "$DB_PATH"
  else
    docker compose run --rm --no-deps --no-build -T "$SERVICE" node "$DB_CLI" dump-db "$DB_PATH"
  fi
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

output="${1:-}"
if [[ -z "$output" ]]; then
  echo "Missing output file path." >&2
  usage
  exit 1
fi

if [[ "$output" == "-" ]]; then
  echo "Use a file path, not '-' (stdout redirect is not supported here)." >&2
  exit 1
fi

if [[ ! -f "$DB_PATH" ]]; then
  echo "$DB_PATH not found. Nothing to dump." >&2
  exit 1
fi

out_dir="$(dirname "$output")"
if [[ "$out_dir" != "." && ! -d "$out_dir" ]]; then
  mkdir -p "$out_dir"
fi

echo "Dumping $DB_PATH to $output ..."
run_dump > "$output"

if ! grep -q '^-- Turso dump of ' "$output"; then
  echo "Dump output is invalid (stdout was polluted — rebuild first: ./scripts/build.sh bot)." >&2
  rm -f "$output"
  exit 1
fi

echo "Done."
