# Stage 1: build the static site with Astro + Tailwind.
FROM node:20-alpine AS build
WORKDIR /site

COPY package.json package-lock.json ./
RUN npm ci

COPY astro.config.mjs tsconfig.json ./
COPY files ./files
COPY src ./src

# The host caps processes/threads per container tightly (fork EAGAIN, Go/Rust
# "failed to create new OS thread"). Node, esbuild (Go) and Tailwind's oxide/
# lightningcss (Rust/Rayon) all spawn one thread per visible CPU by default;
# pin the whole toolchain to (near) single-threaded and invoke astro directly
# to skip the npm/sh wrapper processes. Costs a few seconds on a site this small.
ENV GOMAXPROCS=1 \
    RAYON_NUM_THREADS=1 \
    UV_THREADPOOL_SIZE=2 \
    NODE_OPTIONS="--v8-pool-size=2" \
    ASTRO_TELEMETRY_DISABLED=1
RUN node ./node_modules/astro/astro.js build

# Stage 2: serve the generated files with nginx.
# The build writes the complete site into public/ (see astro.config.mjs),
# which becomes the nginx webroot.
FROM nginx:alpine
COPY --from=build /site/public /var/www/public
COPY nginx.conf /etc/nginx/conf.d/default.conf
