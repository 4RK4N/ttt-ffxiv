// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * The DE homepage lives at the legacy URL /de.html, but a page file at
 * src/pages/de.astro would collide with src/pages/de/index.astro (both claim
 * the "/de" route). So the page is authored at src/pages/de-home/ and this
 * integration moves the built file to de.html; in dev, /de.html is rewritten
 * to /de-home/ so the URL works there too.
 */
const legacyDeHtml = {
  name: 'legacy-de-html',
  hooks: {
    'astro:server:setup': ({ server }) => {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/de.html') req.url = '/de-home/';
        next();
      });
    },
    'astro:build:done': async ({ dir }) => {
      const root = fileURLToPath(dir);
      await rename(path.join(root, 'de-home', 'index.html'), path.join(root, 'de.html'));
      await rm(path.join(root, 'de-home'), { recursive: true });
    },
  },
};

export default defineConfig({
  site: 'https://ttt-ffxiv.eu',
  // Static source assets (images, robots.txt, ...) live in files/ and are
  // copied verbatim into the build output.
  publicDir: './files',
  // The web entry directory: wiped and regenerated on every build.
  outDir: './public',
  // 'preserve' keeps the exact URL scheme of the old export:
  // src/pages/de-home/index.astro -> /de-home/index.html (then moved to /de.html),
  // nested index.astro -> /<dir>/index.html
  build: { format: 'preserve' },
  integrations: [legacyDeHtml],
  vite: { plugins: [tailwindcss()] },
});
