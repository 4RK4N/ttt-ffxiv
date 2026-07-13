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
Usage: $0 <migration.sql>

Apply an incremental SQL migration inside ttt-postgres.

Example:
  $0 scripts/db/002_description.sql
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

require_postgres
wait_for_postgres

echo "Applying $migration ..."
docker compose exec -T ttt-postgres psql -U ttt -d ttt -v ON_ERROR_STOP=1 -f - < "$migration"
echo "Done."
