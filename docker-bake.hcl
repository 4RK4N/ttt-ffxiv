// Merged with docker-compose.yml when COMPOSE_BAKE=true. Explicit nproc ulimits for BuildKit RUN steps.
target "ttt-discord-bot" {
  dockerfile = "bot/Dockerfile"
  ulimits = ["nproc=65535:65535"]
}

target "ttt-web-editor" {
  dockerfile = "web-admin/Dockerfile"
  ulimits = ["nproc=65535:65535"]
}

target "ttt-website" {
  ulimits = ["nproc=65535:65535"]
}
