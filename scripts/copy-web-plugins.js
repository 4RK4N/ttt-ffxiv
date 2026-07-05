// Copies every shared/modules/*/web-plugin.json into dist/shared/modules/*/.
// `tsc` does not emit .json files; the web editor reads manifests from dist at runtime.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcModules = join(root, "shared", "modules");
const distModules = join(root, "dist", "shared", "modules");

if (!existsSync(srcModules)) {
  console.warn(
    "[copy-web-plugins] No shared/modules directory; nothing to copy.",
  );
  process.exit(0);
}

let copied = 0;
for (const entry of readdirSync(srcModules, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const manifest = join(srcModules, entry.name, "web-plugin.json");
  if (!existsSync(manifest)) continue;

  const destDir = join(distModules, entry.name);
  mkdirSync(destDir, { recursive: true });
  cpSync(manifest, join(destDir, "web-plugin.json"));
  copied++;
}

console.log(
  `[copy-web-plugins] Copied ${copied} web-plugin.json manifest(s) into dist.`,
);

const adminCssSrc = join(root, "web-admin", "src", "ui", "css");
const adminCssDest = join(root, "dist", "web-admin", "src", "ui", "css");
if (existsSync(adminCssSrc)) {
  cpSync(adminCssSrc, adminCssDest, { recursive: true });
  const tablerSrc = join(
    root,
    "node_modules",
    "@tabler",
    "core",
    "dist",
    "css",
    "tabler.min.css",
  );
  if (existsSync(tablerSrc)) {
    cpSync(tablerSrc, join(adminCssDest, "tabler.min.css"));
  } else {
    console.error("[copy-web-plugins] Missing @tabler/core. Run npm install.");
    process.exit(1);
  }
  console.log("[copy-web-plugins] Copied admin CSS into dist.");
  const tablerDest = join(adminCssDest, "tabler.min.css");
  if (!existsSync(tablerDest)) {
    console.error("[copy-web-plugins] tabler.min.css missing after copy.");
    process.exit(1);
  }
} else {
  console.error("[copy-web-plugins] Missing web-admin/src/ui/css/.");
  process.exit(1);
}

const adminJsDest = join(root, "dist", "web-admin", "src", "ui", "js");
mkdirSync(adminJsDest, { recursive: true });
const htmxSrc = join(root, "node_modules", "htmx.org", "dist", "htmx.min.js");
if (!existsSync(htmxSrc)) {
  console.error("[copy-web-plugins] Missing htmx.org. Run npm install.");
  process.exit(1);
}
cpSync(htmxSrc, join(adminJsDest, "htmx.min.js"));
console.log("[copy-web-plugins] Copied htmx.min.js into dist.");
if (!existsSync(join(adminJsDest, "htmx.min.js"))) {
  console.error("[copy-web-plugins] htmx.min.js missing after copy.");
  process.exit(1);
}
