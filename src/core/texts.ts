import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// Runtime-writable data directory, resolved from the process working directory
// (not import.meta.url) so it is stable across `tsx` dev, compiled `dist/` prod,
// and Docker, and lives outside the build output so edits survive rebuilds.
// A future web editor writes the same files.
export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? process.cwd(), 'data');

/** Resolves a path inside a module's data folder: data/<namespace>/<segments>. */
export function moduleDataPath(namespace: string, ...segments: string[]): string {
  return path.join(DATA_DIR, namespace, ...segments);
}

/**
 * Replaces `{token}` placeholders in a template with the provided values.
 * Unknown tokens are left untouched.
 */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

interface CacheEntry {
  mtimeMs: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();

/** Shallow-merges file overrides over defaults (one level deep is enough here). */
function merge<T extends object>(defaults: T, overrides: Partial<T>): T {
  return { ...defaults, ...overrides };
}

/**
 * Loads a JSON file layered over the supplied code defaults. Re-reads only when
 * the file's mtime changes, so a future web editor's (or hand) edits take effect
 * on the next call without a restart.
 *
 * Fails gracefully: on a missing file, parse error, or any other failure it
 * logs a warning and returns the defaults, so the bot never breaks on bad data.
 */
function loadJson<T extends object>(file: string, defaults: T): T {
  let mtimeMs: number;
  try {
    mtimeMs = statSync(file).mtimeMs;
  } catch {
    // No file yet: fall back to defaults silently (expected before seeding).
    return defaults;
  }

  const cached = cache.get(file);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.value as T;
  }

  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as Partial<T>;
    const value = merge(defaults, parsed);
    cache.set(file, { mtimeMs, value });
    return value;
  } catch (err) {
    console.warn(`[data] Failed to read "${file}"; using defaults.`, err);
    return defaults;
  }
}

/** Clears cached reads for a module's config.json and texts.json after a write. */
export function invalidateModuleCache(namespace: string): void {
  cache.delete(moduleDataPath(namespace, 'config.json'));
  cache.delete(moduleDataPath(namespace, 'texts.json'));
}

/** Loads a module's editable texts from data/<namespace>/texts.json. */
export function getTexts<T extends object>(namespace: string, defaults: T): T {
  return loadJson(moduleDataPath(namespace, 'texts.json'), defaults);
}

/** Loads a module's runtime settings from data/<namespace>/config.json. */
export function getConfig<T extends object>(namespace: string, defaults: T): T {
  return loadJson(moduleDataPath(namespace, 'config.json'), defaults);
}

/**
 * Master on/off switch for a module, read from config.json's `enabled` key.
 * Only an explicit `false` disables; a missing key (or any other value) means
 * enabled, so existing modules without the key keep working. Hot-reloads with
 * the rest of the config, so the web editor's toggle takes effect without a restart.
 */
export function isModuleEnabled(namespace: string): boolean {
  return getConfig(namespace, { enabled: true } as { enabled?: boolean }).enabled !== false;
}
