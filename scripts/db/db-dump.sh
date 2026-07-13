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

require_postgres() {
  if ! docker compose exec -T ttt-postgres pg_isready -U ttt -d ttt >/dev/null 2>&1; then
    echo "PostgreSQL is not running. Start it with: docker compose up -d ttt-postgres" >&2
    exit 1
  fi
}

usage() {
  cat >&2 <<EOF
Usage: $0 <output.sql>

Dump the ttt database to a plain SQL file (pg_dump).

Example:
  $0 backups/ttt-$(date +%F).sql
EOF
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

require_postgres
wait_for_postgres

out_dir="$(dirname "$output")"
if [[ "$out_dir" != "." && ! -d "$out_dir" ]]; then
  mkdir -p "$out_dir"
fi

echo "Dumping database to $output ..."
docker compose exec -T ttt-postgres pg_dump -U ttt -d ttt --no-owner --no-acl > "$output"
echo "Done."
