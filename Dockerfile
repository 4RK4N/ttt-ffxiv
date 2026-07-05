FROM node:24-alpine AS deps-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM deps-dev AS build-bot
COPY tsconfig.base.json tsconfig.json ./
COPY shared ./shared
COPY bot ./bot
COPY scripts ./scripts
RUN npm run build:bot

FROM node:24-alpine AS deps-prod-bot
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && \
    rm -rf node_modules/hono node_modules/@hono

FROM node:24-alpine AS ttt-discord-bot
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps-prod-bot /app/node_modules ./node_modules
COPY --from=deps-prod-bot /app/package.json ./package.json
COPY --from=build-bot /app/dist ./dist
USER node
CMD ["node", "dist/bot/src/index.js"]

FROM deps-dev AS build-web-admin
COPY tsconfig.base.json tsconfig.json ./
COPY shared ./shared
COPY web-admin ./web-admin
COPY scripts/copy-web-plugins.js ./scripts/copy-web-plugins.js
RUN npm run build:web-admin

FROM node:24-alpine AS deps-prod-web
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && \
    rm -rf node_modules/@napi-rs

FROM node:24-alpine AS ttt-web-editor
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps-prod-web /app/node_modules ./node_modules
COPY --from=deps-prod-web /app/package.json ./package.json
COPY --from=build-web-admin /app/dist ./dist
USER node
CMD ["node", "dist/web-admin/src/server.js"]
