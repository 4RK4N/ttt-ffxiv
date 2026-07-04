# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder
WORKDIR /site
COPY package.json package-lock.json ./
RUN npm ci
COPY astro.config.mjs tsconfig.json ./
COPY public ./public
COPY src ./src
RUN sh -c "ulimit -c 0 && npm run build"

FROM nginx:alpine
COPY --from=builder /site/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8089
