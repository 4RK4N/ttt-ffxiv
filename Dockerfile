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

FROM deps-dev AS build-web
COPY tsconfig.base.json tsconfig.json ./
COPY shared ./shared
COPY web-admin ./web-admin
COPY scripts ./scripts
RUN npm run build:web-admin

FROM node:24-alpine AS deps-prod
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

FROM deps-prod AS deps-prod-bot
# Web editor only — bot uses discord.js + @napi-rs/canvas.
RUN rm -rf node_modules/hono node_modules/@hono

FROM deps-prod AS deps-prod-web
# Bot only — web uses hono + @hono/node-server (REST via fetch, no discord.js client).
RUN rm -rf node_modules/@napi-rs node_modules/discord.js node_modules/@discordjs

FROM node:24-alpine AS ttt-discord-bot
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps-prod-bot /app/node_modules ./node_modules
COPY --from=deps-prod-bot /app/package.json ./package.json
COPY --from=build-bot /app/dist/shared ./dist/shared
COPY --from=build-bot /app/dist/bot ./dist/bot
COPY --from=build-bot /app/dist/scripts ./dist/scripts
COPY scripts/internal-api-health.mjs ./scripts/internal-api-health.mjs
USER node
CMD ["node", "dist/bot/src/index.js"]

FROM node:24-alpine AS ttt-web-editor
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps-prod-web /app/node_modules ./node_modules
COPY --from=deps-prod-web /app/package.json ./package.json
COPY --from=build-web /app/dist/shared ./dist/shared
COPY --from=build-web /app/dist/web-admin ./dist/web-admin
USER node
CMD ["node", "dist/web-admin/src/server.js"]
