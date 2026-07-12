# Sharp/libvips is unreliable on Alpine (musl) for some JPEG/PNG sources; use glibc for the build.
FROM node:24-bookworm-slim AS builder
WORKDIR /site
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci
COPY astro.config.mjs tsconfig.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:alpine
COPY --from=builder /site/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8089
