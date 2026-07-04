# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder
WORKDIR /site
ENV SHARP_CONCURRENCY=2
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked,mode=0755 \
    npm ci
COPY astro.config.mjs tsconfig.json ./
COPY public ./public
COPY src ./src
RUN --mount=type=cache,target=/root/.npm,sharing=locked,mode=0755 \
    --mount=type=cache,id=ttt-website-astro,target=/site/.astro-cache,sharing=locked,mode=0755 \
    npm run build

FROM nginx:alpine
COPY --from=builder /site/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8089
