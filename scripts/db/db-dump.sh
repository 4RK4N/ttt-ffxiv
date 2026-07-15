#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

DB_PATH="data/ttt.db"
DB_CLI="dist/scripts/db/cli.js"
SERVICE="ttt-discord-bot"

usage() {
  cat >&2 <<EOF
Usage: $0 [--include-secrets] <output.sql>

Dump data/ttt.db to a plain SQL file (CREATE TABLE + INSERT statements).
Requires ttt-discord-bot to be running (uses docker compose exec).

By default, app_config secrets are redacted. Pass --include-secrets for a
full credential-bearing backup (treat the output like the DB file).

Examples:
  $0 backups/ttt-$(date +%F).sql
  $0 --include-secrets backups/ttt-$(date +%F).sql
  $0 backups/ttt-$(date +%F).sql --include-secrets

If the bot is stopped:
  docker compose up -d $SERVICE
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

include_secrets=0
output=""
for arg in "$@"; do
  case "$arg" in
    --include-secrets)
      include_secrets=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -n "$output" ]]; then
        echo "Unexpected argument: $arg" >&2
        usage
        exit 1
      fi
      output="$arg"
      ;;
  esac
done

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

if ! docker compose ps --status running -q "$SERVICE" 2>/dev/null | grep -q .; then
  echo "$SERVICE is not running. Start it first: docker compose up -d $SERVICE" >&2
  exit 1
fi

out_dir="$(dirname "$output")"
if [[ "$out_dir" != "." && ! -d "$out_dir" ]]; then
  mkdir -p "$out_dir"
fi

echo "Dumping $DB_PATH to $output ..."
dump_args=(dump-db)
if [[ "$include_secrets" -eq 1 ]]; then
  dump_args+=(--include-secrets)
fi
dump_args+=("$DB_PATH")
docker compose exec -T "$SERVICE" node "$DB_CLI" "${dump_args[@]}" > "$output"

if ! grep -q '^-- Turso dump of ' "$output"; then
  echo "Dump output is invalid." >&2
  rm -f "$output"
  exit 1
fi

echo "Done."
