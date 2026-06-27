# Small, production-ready image for the Discord bot.
FROM node:20-alpine

# App lives here.
WORKDIR /app

# Install dependencies first for better layer caching.
# Uses package-lock.json for reproducible installs; omits dev dependencies.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the source.
COPY . .

# Run as the built-in non-root user for safety.
USER node

# The bot is a long-running process (no inbound ports needed).
CMD ["node", "src/index.js"]
