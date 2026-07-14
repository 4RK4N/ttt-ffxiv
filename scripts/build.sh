#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

ALL_SERVICES=(ttt-discord-bot ttt-website)

usage() {
  cat >&2 <<EOF
Usage: $0 [-v] [--no-cache] [service ...]

Build and recreate Docker services (default: bot + website).

Services (names or aliases):
  ttt-discord-bot   bot, discord-bot
  ttt-website       website

Examples:
  $0
  $0 -v --no-cache
  $0 bot
  $0 bot website
EOF
}

resolve_service() {
  case "$1" in
    ttt-discord-bot | bot | discord-bot) echo ttt-discord-bot ;;
    ttt-website | website) echo ttt-website ;;
    ttt-web-editor | web | web-editor | editor)
      echo "ttt-web-editor was merged into ttt-discord-bot; use: bot" >&2
      echo ttt-discord-bot
      ;;
    *)
      echo "Unknown service: $1" >&2
      usage
      return 1
      ;;
  esac
}

verbose=0
no_cache=0
selected=()

while [[ $# -gt 0 ]]; do
  case $1 in
    -v) verbose=1 ;;
    --no-cache) no_cache=1 ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
    *)
      if ! svc=$(resolve_service "$1"); then
        exit 1
      fi
      selected+=("$svc")
      ;;
  esac
  shift
done

if ((${#selected[@]} == 0)); then
  selected=("${ALL_SERVICES[@]}")
else
  declare -A seen=()
  unique=()
  for svc in "${selected[@]}"; do
    if [[ -z "${seen[$svc]+x}" ]]; then
      seen[$svc]=1
      unique+=("$svc")
    fi
  done
  selected=("${unique[@]}")
fi

cache_flag=()
if ((no_cache)); then
  cache_flag=(--no-cache)
fi

compose=(docker compose)
if ((verbose)); then
  compose+=(--progress plain)
fi

compose_build() {
  if "${compose[@]}" build "${cache_flag[@]}" "$1"; then
    return 0
  fi
  echo "Build failed for $1, retrying once in 5s..." >&2
  sleep 5
  "${compose[@]}" build "${cache_flag[@]}" "$1"
}

for svc in "${selected[@]}"; do
  compose_build "$svc"
done

for svc in "${selected[@]}"; do
  "${compose[@]}" up -d --force-recreate "$svc"
done
