FROM node:24-alpine AS deps-dev
WORKDIR /app
COPY discord-bot/package.json discord-bot/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM deps-dev AS build
WORKDIR /app
COPY discord-bot/tsconfig.base.json discord-bot/tsconfig.json ./
COPY discord-bot/shared ./shared
COPY discord-bot/bot ./bot
COPY discord-bot/web-admin ./web-admin
COPY discord-bot/scripts ./scripts
RUN npm run build:app

# Turso (@tursodatabase/database) ships linux-gnu natives only — not musl/Alpine.
FROM node:24-slim AS ttt-discord-bot
WORKDIR /app
ENV NODE_ENV=production
COPY discord-bot/package.json discord-bot/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
COPY --from=build /app/dist/shared ./dist/shared
COPY --from=build /app/dist/bot ./dist/bot
COPY --from=build /app/dist/web-admin ./dist/web-admin
COPY --from=build /app/dist/scripts ./dist/scripts
COPY discord-bot/scripts/db/schema.sql ./scripts/db/schema.sql
COPY discord-bot/scripts/db/migrations ./scripts/db/migrations
COPY discord-bot/shared/modules ./shared/modules
USER node
CMD ["node", "dist/bot/src/app.js"]
