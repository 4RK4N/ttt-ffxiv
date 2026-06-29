import { mkdir } from 'node:fs/promises';
import { renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Writes JSON atomically (temp file + rename) so readers never see half-written data.
 */
export async function writeJsonAtomic(file: string, data: unknown): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const json = JSON.stringify(data, null, 2) + '\n';
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, json, 'utf8');
  renameSync(tmp, file);
}
