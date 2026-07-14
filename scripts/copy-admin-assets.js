// Verifies admin CSS/JS build output and copies htmx into dist.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const adminCss = join(
  root,
  "dist",
  "web-admin",
  "src",
  "ui",
  "css",
  "admin.min.css",
);
const adminJs = join(
  root,
  "dist",
  "web-admin",
  "src",
  "ui",
  "js",
  "admin.min.js",
);
if (!existsSync(adminCss)) {
  console.error(
    "[copy-admin-assets] admin.min.css missing; run npm run build:admin-assets.",
  );
  process.exit(1);
}
if (!existsSync(adminJs)) {
  console.error(
    "[copy-admin-assets] admin.min.js missing; run npm run build:admin-assets.",
  );
  process.exit(1);
}

const adminJsDest = join(root, "dist", "web-admin", "src", "ui", "js");
mkdirSync(adminJsDest, { recursive: true });
const htmxSrc = join(root, "node_modules", "htmx.org", "dist", "htmx.min.js");
if (!existsSync(htmxSrc)) {
  console.error("[copy-admin-assets] Missing htmx.org. Run npm install.");
  process.exit(1);
}
cpSync(htmxSrc, join(adminJsDest, "htmx.min.js"));
if (!existsSync(join(adminJsDest, "htmx.min.js"))) {
  console.error("[copy-admin-assets] htmx.min.js missing after copy.");
  process.exit(1);
}

const adminCssDir = join(root, "dist", "web-admin", "src", "ui", "css");
for (const stray of ["admin-styles.js", "admin.css", "admin2.css"]) {
  try {
    rmSync(join(adminCssDir, stray));
  } catch {
    /* ignore */
  }
}
for (const stray of ["admin.js"]) {
  try {
    rmSync(join(adminJsDest, stray));
  } catch {
    /* ignore */
  }
}

// Remove stale web-plugin.json copies from older builds.
const distModules = join(root, "dist", "shared", "modules");
if (existsSync(distModules)) {
  for (const entry of readdirSync(distModules, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      rmSync(join(distModules, entry.name, "web-plugin.json"));
    } catch {
      /* ignore */
    }
  }
}

console.log(
  "[copy-admin-assets] Verified admin.min.css, admin.min.js, and htmx.min.js in dist.",
);
