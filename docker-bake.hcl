// Merged with docker-compose.yml when COMPOSE_BAKE=true. Explicit nproc ulimits for BuildKit RUN steps.

target "ttt-discord-bot" {

  dockerfile = "Dockerfile"

  target     = "ttt-discord-bot"

  ulimits    = ["nproc=65535:65535"]

}

target "ttt-website" {

  ulimits = ["nproc=65535:65535"]

}
