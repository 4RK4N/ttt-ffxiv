// Copies every src/modules/*/web-plugin.json into the matching compiled
// dist/src/modules/*/ folder. `tsc` does not emit .json files, and the Docker
// runtime image only ships dist/, so the web editor needs these manifests there.
// Dev (tsx) reads them straight from src/ and never runs this script.
import { cpSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcModules = join(root, 'src', 'modules');
const distModules = join(root, 'dist', 'src', 'modules');

if (!existsSync(srcModules)) {
  console.warn('[copy-web-plugins] No src/modules directory; nothing to copy.');
  process.exit(0);
}

let copied = 0;
let skipped = 0;
for (const entry of readdirSync(srcModules, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const manifest = join(srcModules, entry.name, 'web-plugin.json');
  if (!existsSync(manifest)) continue;

  const destDir = join(distModules, entry.name);
  if (!existsSync(destDir)) {
    console.warn(
      `[copy-web-plugins] Skipping "${entry.name}": no compiled output at ${destDir}.`
    );
    skipped += 1;
    continue;
  }

  cpSync(manifest, join(destDir, 'web-plugin.json'));
  copied++;
}

console.log(`[copy-web-plugins] Copied ${copied} web-plugin.json manifest(s) into dist.`);

if (skipped > 0) {
  console.error(
    `[copy-web-plugins] ${skipped} manifest(s) skipped because dist output was missing. Run "npm run build" first.`
  );
  process.exit(1);
}
