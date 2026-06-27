# Stage 1: compile TypeScript to plain JS.
FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies (including dev) for the build.
# Uses package-lock.json for reproducible installs.
COPY package.json package-lock.json ./
RUN npm ci

# Compile the sources into dist/.
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

# Stage 2: small runtime image with only production dependencies.
FROM node:20-alpine
WORKDIR /app

# Production-only dependencies.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Bring in the compiled output from the build stage.
COPY --from=builder /app/dist ./dist

# Run as the built-in non-root user for safety.
USER node

# The bot is a long-running process (no inbound ports needed).
CMD ["node", "dist/src/index.js"]
