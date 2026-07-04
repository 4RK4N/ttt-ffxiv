# syntax=docker/dockerfile:1
# Stage 1: compile TypeScript
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked,mode=0755 \
    npm ci

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build
RUN test -f dist/src/web/ui/css/tabler.min.css
RUN test -f dist/src/web/ui/js/htmx.min.js
RUN npm prune --omit=dev

# Stage 2: runtime
FROM node:24-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY data ./data

USER node
CMD ["node", "dist/src/index.js"]
