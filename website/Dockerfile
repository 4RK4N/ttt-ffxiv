# Stage 1: build the static site with Astro + Tailwind.
FROM node:20-alpine AS build
WORKDIR /site

COPY package.json package-lock.json ./
RUN npm ci

COPY astro.config.mjs tsconfig.json ./
COPY files ./files
COPY src ./src
RUN npm run build

# Stage 2: serve the generated files with nginx.
# The build writes the complete site into public/ (see astro.config.mjs),
# which becomes the nginx webroot.
FROM nginx:alpine
COPY --from=build /site/public /var/www/public
COPY nginx.conf /etc/nginx/conf.d/default.conf
