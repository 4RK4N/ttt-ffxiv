FROM node:24-alpine AS deps-dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM deps-dev AS build
COPY tsconfig.base.json tsconfig.json ./
COPY shared ./shared
COPY bot ./bot
COPY web-admin ./web-admin
COPY scripts ./scripts
RUN npm run build:app

# Turso (@tursodatabase/database) ships linux-gnu natives only — not musl/Alpine.
FROM node:24-slim AS ttt-discord-bot
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev
COPY --from=build /app/dist/shared ./dist/shared
COPY --from=build /app/dist/bot ./dist/bot
COPY --from=build /app/dist/web-admin ./dist/web-admin
COPY --from=build /app/dist/scripts ./dist/scripts
COPY scripts/db/schema.sql ./scripts/db/schema.sql
COPY shared/modules ./shared/modules
COPY scripts/web-health.mjs ./scripts/web-health.mjs
USER node
CMD ["node", "dist/bot/src/app.js"]
