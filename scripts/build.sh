#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PARALLEL="${COMPOSE_PARALLEL_LIMIT:-1}"

# Uncollapsed build logs (--progress is a global compose flag; forwarded to buildx bake).

# Always --no-cache: layer cache has produced stale HTML/CSS/JS in practice.
# Sequential equivalent of:
#   docker compose build --no-cache && docker compose up -d --force-recreate
compose=(
  docker compose
  --progress plain
  --ansi never
  --parallel "$PARALLEL"
)

"${compose[@]}" build --no-cache ttt-discord-bot
"${compose[@]}" build --no-cache ttt-web-editor
"${compose[@]}" build --no-cache ttt-website
docker compose up -d --force-recreate
