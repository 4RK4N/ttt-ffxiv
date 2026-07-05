#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Uncollapsed build logs (--progress is a global compose flag; forwarded to buildx bake).

# Always --no-cache: layer cache has produced stale HTML/CSS/JS in practice.
# Sequential equivalent of:
#   docker compose build --no-cache && docker compose up -d --force-recreate
compose=(
  docker compose
  --progress plain
  --ansi never
)

compose_build() {
  local service=$1
  if "${compose[@]}" build --no-cache "$service"; then
    return 0
  fi
  echo "Build failed for ${service}, retrying once in 5s..." >&2
  sleep 5
  "${compose[@]}" build --no-cache "$service"
}

compose_build ttt-discord-bot
compose_build ttt-web-editor
compose_build ttt-website
docker compose up -d --force-recreate
