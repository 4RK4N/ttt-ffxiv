#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

verbose=0
no_cache=0
while [[ $# -gt 0 ]]; do
  case $1 in
    -v) verbose=1 ;;
    --no-cache) no_cache=1 ;;
    *)
      echo "Usage: $0 [-v] [--no-cache]" >&2
      exit 1
      ;;
  esac
  shift
done

cache_flag=()
if (( no_cache )); then
  cache_flag=(--no-cache)
fi

# Default: compose auto progress (compact). -v: uncollapsed build logs via --progress plain.
compose=(docker compose)
if (( verbose )); then
  compose+=(--progress plain)
fi

compose_build() {
  if "${compose[@]}" build "${cache_flag[@]}" "$@"; then
    return 0
  fi
  echo "Build failed, retrying once in 5s..." >&2
  sleep 5
  "${compose[@]}" build "${cache_flag[@]}" "$@"
}

# Bot + editor share deps in Dockerfile; one bake pass reuses npm ci.
compose_build ttt-discord-bot ttt-web-editor
compose_build ttt-website
docker compose up -d --force-recreate
