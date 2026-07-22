# Sharp/libvips is unreliable on Alpine (musl) for some JPEG/PNG sources; use glibc for the build.
FROM node:24-bookworm-slim AS builder
WORKDIR /site
COPY website/package.json website/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
  npm ci
COPY website/astro.config.mjs website/tsconfig.json ./
COPY website/public ./public
COPY website/src ./src
# Cap parallel OS threads during astro build (compiler-rs + esbuild + Node).
ENV RAYON_NUM_THREADS=2 \
  GOMAXPROCS=2 \
  UV_THREADPOOL_SIZE=4
RUN npm run build

FROM nginx:alpine AS ttt-website
COPY --from=builder /site/dist /usr/share/nginx/html
COPY website/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8089
