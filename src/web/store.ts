import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { moduleDataPath } from '../core/texts.js';
import type { WebPlugin } from './plugins.js';

/**
 * Reads the current saved values for a plugin's namespace from
 * data/<namespace>/texts.json. Only keys declared in the manifest are returned;
 * unknown/missing keys come back as empty strings so the form always renders.
 * Never throws: a missing or unreadable file yields all-empty values.
 */
export function readValues(plugin: WebPlugin): Record<string, string> {
  const file = moduleDataPath(plugin.namespace, 'texts.json');

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    // No file yet, or invalid JSON: fall back to empty values.
    parsed = {};
  }

  const values: Record<string, string> = {};
  for (const field of plugin.fields) {
    const current = parsed[field.key];
    values[field.key] = typeof current === 'string' ? current : '';
  }
  return values;
}

export class ValidationError extends Error {}

/**
 * Validates an incoming edit against the manifest and writes it atomically to
 * data/<namespace>/texts.json. Only keys present in the manifest are accepted
 * (unknown keys are rejected), and all values must be strings. The file is
 * written to a temp path then renamed so a reader never sees a half-written
 * file, and so the bot's mtime-based hot reload picks up the change.
 */
export async function writeValues(
  plugin: WebPlugin,
  input: unknown
): Promise<Record<string, string>> {
  if (typeof input !== 'object' || input === null) {
    throw new ValidationError('Request body must be a JSON object of field values.');
  }

  const allowed = new Set(plugin.fields.map((f) => f.key));
  const incoming = input as Record<string, unknown>;

  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (!allowed.has(key)) {
      throw new ValidationError(`Unknown field "${key}" for module "${plugin.namespace}".`);
    }
    if (typeof value !== 'string') {
      throw new ValidationError(`Field "${key}" must be a string.`);
    }
    next[key] = value;
  }

  // Preserve any fields not included in this request by layering over current values.
  const merged = { ...readValues(plugin), ...next };

  const file = moduleDataPath(plugin.namespace, 'texts.json');
  await mkdir(dirname(file), { recursive: true });

  const json = JSON.stringify(merged, null, 2) + '\n';
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, json, 'utf8');
  renameSync(tmp, file);

  return merged;
}
