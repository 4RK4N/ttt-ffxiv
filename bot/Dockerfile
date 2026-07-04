FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.base.json tsconfig.json ./
COPY shared ./shared
COPY bot ./bot
COPY scripts ./scripts
RUN npm run build:bot
RUN test -f dist/bot/src/index.js
RUN npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY data ./data

USER node
CMD ["node", "dist/bot/src/index.js"]
