FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.base.json tsconfig.json ./
COPY shared ./shared
COPY web-admin ./web-admin
COPY scripts/copy-web-plugins.js ./scripts/copy-web-plugins.js
RUN npm run build:web-admin
RUN test -f dist/web-admin/src/ui/css/tabler.min.css
RUN test -f dist/web-admin/src/ui/js/htmx.min.js
RUN npm prune --omit=dev

FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY data ./data

USER node
CMD ["node", "dist/web-admin/src/server.js"]
