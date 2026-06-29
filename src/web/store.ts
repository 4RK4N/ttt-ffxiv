import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { moduleDataPath } from '../core/texts.js';
import type { WebPlugin, WebPluginField, WebFieldStore } from './plugins.js';

/** A field value is a string (text/channel) or a string array (channel-multi). */
export type FieldValue = string | string[];

/** Map of store -> data file name. */
const STORE_FILES: Record<WebFieldStore, string> = {
  texts: 'texts.json',
  config: 'config.json',
};

/** A field's natural value type, derived from its input type. */
function isMultiField(field: WebPluginField): boolean {
  return field.type === 'channel-multi';
}

/** Reads and parses a module data file, returning {} on any failure. */
function readDataJson(namespace: string, store: WebFieldStore): Record<string, unknown> {
  const file = moduleDataPath(namespace, STORE_FILES[store]);
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch {
    // No file yet, or invalid JSON: fall back to empty values.
    return {};
  }
}

/** Coerces an unknown value to a string array of channel ids. */
function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/**
 * Writes `data` as pretty JSON to a module's data file via a temp file + rename,
 * so a reader never sees a half-written file and the bot's mtime-based hot reload
 * picks up the change.
 */
async function writeJsonAtomic(file: string, data: Record<string, unknown>): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const json = JSON.stringify(data, null, 2) + '\n';
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, json, 'utf8');
  renameSync(tmp, file);
}

/**
 * Reads a module's master on/off switch from config.json's `enabled` key.
 * Mirrors the bot's `isModuleEnabled`: only an explicit `false` is disabled, so a
 * missing key (legacy config) reads as enabled.
 */
export function readEnabled(namespace: string): boolean {
  return readDataJson(namespace, 'config').enabled !== false;
}

/** Writes a module's master on/off switch to config.json, preserving other keys. */
export async function writeEnabled(namespace: string, enabled: boolean): Promise<boolean> {
  const existing = readDataJson(namespace, 'config');
  const merged = { ...existing, enabled };
  await writeJsonAtomic(moduleDataPath(namespace, STORE_FILES.config), merged);
  return enabled;
}

/**
 * Reads the current saved values for every field in the manifest from the
 * appropriate file (texts.json or config.json). Missing keys come back as empty
 * (string '' or []) so the form always renders. Never throws.
 */
export function readValues(plugin: WebPlugin): Record<string, FieldValue> {
  // Read each backing file once.
  const parsedByStore: Partial<Record<WebFieldStore, Record<string, unknown>>> = {};
  function parsed(store: WebFieldStore): Record<string, unknown> {
    return (parsedByStore[store] ??= readDataJson(plugin.namespace, store));
  }

  const values: Record<string, FieldValue> = {};
  for (const field of plugin.fields) {
    const current = parsed(field.store)[field.key];
    if (isMultiField(field)) {
      values[field.key] = toStringArray(current);
    } else {
      values[field.key] = typeof current === 'string' ? current : '';
    }
  }
  return values;
}

export class ValidationError extends Error { }

/**
 * Validates an incoming edit against the manifest and writes it atomically to
 * the matching files (texts.json and/or config.json). Only keys present in the
 * manifest are accepted; values must match the field type (string, or string[]
 * for channel-multi). Each file is written to a temp path then renamed so a
 * reader never sees a half-written file, and so the bot's mtime-based hot reload
 * picks up the change.
 */
export async function writeValues(
  plugin: WebPlugin,
  input: unknown
): Promise<Record<string, FieldValue>> {
  if (typeof input !== 'object' || input === null) {
    throw new ValidationError('Request body must be a JSON object of field values.');
  }

  const fieldsByKey = new Map(plugin.fields.map((f) => [f.key, f]));
  const incoming = input as Record<string, unknown>;

  // Group validated values by the store they belong to.
  const updatesByStore: Partial<Record<WebFieldStore, Record<string, FieldValue>>> = {};
  for (const [key, value] of Object.entries(incoming)) {
    const field = fieldsByKey.get(key);
    if (!field) {
      throw new ValidationError(`Unknown field "${key}" for module "${plugin.namespace}".`);
    }

    let normalized: FieldValue;
    if (isMultiField(field)) {
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
        throw new ValidationError(`Field "${key}" must be an array of strings.`);
      }
      normalized = value as string[];
    } else {
      if (typeof value !== 'string') {
        throw new ValidationError(`Field "${key}" must be a string.`);
      }
      normalized = value;
    }

    (updatesByStore[field.store] ??= {})[key] = normalized;
  }

  // Write each touched file, preserving keys not included in this request.
  for (const store of Object.keys(updatesByStore) as WebFieldStore[]) {
    const existing = readDataJson(plugin.namespace, store);
    const merged = { ...existing, ...updatesByStore[store] };
    await writeJsonAtomic(moduleDataPath(plugin.namespace, STORE_FILES[store]), merged);
  }

  return readValues(plugin);
}
