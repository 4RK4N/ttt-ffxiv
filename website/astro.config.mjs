// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { rename, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SITE_URL } from "./src/data/site.ts";

const site = SITE_URL;

/** Welcome-hub URLs → language homepages (mirrored in nginx.conf for production). */
const legacyRedirects = {
  "/de/": "/de.html",
  "/en/": "/",
};

/**
 * The DE homepage is served at the legacy URL /de.html. It is authored at
 * src/pages/de-home/ and moved to de.html at build time; in dev, /de.html is
 * rewritten to /de-home/ so the URL works there too.
 */
const legacyDeHtml = {
  name: "legacy-de-html",
  hooks: {
    "astro:server:setup": ({ server }) => {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/de.html") {
          req.url = "/de-home/";
          next();
          return;
        }
        if (req.url === "/de/" || req.url === "/de") {
          res.writeHead(301, { Location: legacyRedirects["/de/"] });
          res.end();
          return;
        }
        if (req.url === "/en/" || req.url === "/en") {
          res.writeHead(301, { Location: legacyRedirects["/en/"] });
          res.end();
          return;
        }
        next();
      });
    },
    "astro:build:done": async ({ dir }) => {
      const root = fileURLToPath(dir);
      await rename(
        path.join(root, "de-home", "index.html"),
        path.join(root, "de.html"),
      );
      await rm(path.join(root, "de-home"), { recursive: true });
    },
  },
};

export default defineConfig({
  site,
  build: { format: "preserve" },
  redirects: legacyRedirects,
  prefetch: {
    defaultStrategy: "hover",
    prefetchAll: false,
  },
  image: {
    defaultQuality: 75,
  },
  fonts: [
    {
      name: "Averia Serif Libre",
      cssVariable: "--font-averia-face",
      provider: fontProviders.google(),
      weights: [400, 700],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      formats: ["woff2"],
    },
    {
      name: "Gochi Hand",
      cssVariable: "--font-gochi-face",
      provider: fontProviders.google(),
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
    },
    {
      name: "Caveat",
      cssVariable: "--font-caveat-face",
      provider: fontProviders.google(),
      weights: [700],
      styles: ["normal"],
      subsets: ["latin"],
      formats: ["woff2"],
    },
  ],
  integrations: [
    legacyDeHtml,
    sitemap({
      customPages: [`${site}/de.html`],
      filter: (page) => !page.includes("/de-home"),
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== "/")
          url.pathname = url.pathname.replace(/\/$/, "");
        item.url = url.href;
        item.changefreq = "weekly";
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      tsconfigPaths: true,
    },
  },
});
