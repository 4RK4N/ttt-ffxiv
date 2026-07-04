#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PARALLEL="${COMPOSE_PARALLEL_LIMIT:-1}"
export BUILDKIT_PROGRESS=plain

# Always --no-cache: layer cache has produced stale HTML/CSS/JS in practice.
# npm + Astro image caches are handled separately via BuildKit cache mounts.
# Sequential equivalent of:
#   docker compose build --no-cache && docker compose up -d --force-recreate
docker compose --parallel "$PARALLEL" build --no-cache ttt-discord-bot
docker compose --parallel "$PARALLEL" build --no-cache ttt-web-editor
docker compose --parallel "$PARALLEL" build --no-cache ttt-website
docker compose up -d --force-recreate
