// Copies module asset folders (images, fonts) into dist/ after tsc, since the
// TypeScript compiler only emits .js and ignores other files. Runs as part of
// `npm run build`, so both local production and the Docker build get the assets.
import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const assetDirs = ['src/modules/welcome-message/assets'];

for (const rel of assetDirs) {
  const src = path.join(root, rel);
  if (!existsSync(src)) {
    console.warn(`[copy-assets] Skipping missing asset dir: ${rel}`);
    continue;
  }
  const dest = path.join(root, 'dist', rel);
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-assets] Copied ${rel} -> dist/${rel}`);
}
