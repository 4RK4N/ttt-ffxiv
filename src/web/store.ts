import { readFileSync } from 'node:fs';
import { MAX_PANEL_OPTIONS } from '../core/limits.js';
import { slugify, toStringArray } from '../core/strings.js';
import { invalidateModuleCache, moduleDataPath } from '../core/texts.js';
import { writeJsonAtomic } from '../core/jsonWrite.js';
import { validateEmbedPanelRow } from '../modules/custom-embeds/validate.js';
import { validateRolePanelRow } from '../modules/reaction-roles/validate.js';
import { validateTicketTypeRow } from '../modules/tickets/validate.js';
import type { WebPlugin, WebPluginField, WebPluginSubField, WebFieldStore } from './plugins.js';
import {
  isBooleanField,
  isBooleanSubField,
  isMultiField,
  isMultiSubField,
  isObjectListField,
  isOptionListSubField,
} from './plugins.js';

export type FieldValue = string | string[] | boolean | Record<string, unknown>[];

const STORE_FILES: Record<WebFieldStore, string> = {
  texts: 'texts.json',
  config: 'config.json',
};

const MAX_OPTION_LIST = MAX_PANEL_OPTIONS;
const SLUG_ID = /^[a-z0-9-]{1,32}$/;
const SNOWFLAKE = /^\d{17,20}$/;

function assertSlugId(id: string, label: string): void {
  if (!SLUG_ID.test(id)) {
    throw new ValidationError(
      `${label}: id must use lowercase letters, numbers, and hyphens only (no colons).`
    );
  }
}

function assertSnowflake(value: string, label: string): void {
  if (value && !SNOWFLAKE.test(value)) {
    throw new ValidationError(`${label} must be a valid Discord ID.`);
  }
}

function assertSnowflakesInArray(values: string[], label: string): void {
  for (let i = 0; i < values.length; i++) {
    assertSnowflake(values[i], `${label}[${i}]`);
  }
}

function validateDiscordIdField(type: WebPluginField['type'], normalized: FieldValue, label: string): void {
  if (type === 'channel' || type === 'role') {
    assertSnowflake(normalized as string, label);
    return;
  }
  if (type === 'channel-multi' || type === 'role-multi') {
    assertSnowflakesInArray(normalized as string[], label);
  }
}

function readDataJson(namespace: string, store: WebFieldStore): Record<string, unknown> {
  const file = moduleDataPath(namespace, STORE_FILES[store]);
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      return {};
    }
    console.warn(`[web] Failed to read "${file}"; refusing to use corrupt or unreadable data.`, err);
    throw new DataReadError(
      `Cannot read ${STORE_FILES[store]} for "${namespace}": file is missing, unreadable, or corrupt. Fix it on disk before saving.`
    );
  }
}

export class DataReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataReadError';
  }
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function isSubFieldVisible(sub: WebPluginSubField, mergedRow: Record<string, unknown>): boolean {
  if (!sub.visibleWhen) return true;
  for (const [watchKey, allowed] of Object.entries(sub.visibleWhen)) {
    const current = mergedRow[watchKey];
    if (typeof current !== 'string' || !allowed.includes(current)) return false;
  }
  return true;
}

function clearedSubValue(sub: WebPluginSubField): FieldValue {
  if (isMultiSubField(sub)) return [];
  if (isBooleanSubField(sub)) return false;
  if (isOptionListSubField(sub)) return [];
  return '';
}

function applyClearWhenHidden(
  field: WebPluginField,
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>
): void {
  const merged = { ...configRow, ...textRow };
  for (const sub of field.itemFields ?? []) {
    if (!sub.clearWhenHidden || !sub.visibleWhen) continue;
    if (isSubFieldVisible(sub, merged)) continue;
    const cleared = clearedSubValue(sub);
    const store = sub.store ?? 'config';
    if (store === 'texts') textRow[sub.key] = cleared;
    else configRow[sub.key] = cleared;
  }
}

function readSubValue(sub: WebPluginSubField, val: unknown): FieldValue {
  if (isMultiSubField(sub)) return toStringArray(val);
  if (isBooleanSubField(sub)) return val === true;
  if (isOptionListSubField(sub)) {
    if (!Array.isArray(val)) return [];
    return val.filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null);
  }
  return typeof val === 'string' ? val : '';
}

function validateOptionList(
  sub: WebPluginSubField,
  value: unknown,
  label: string
): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(`${label}.${sub.key} must be an array of objects.`);
  }
  if (value.length > MAX_OPTION_LIST) {
    throw new ValidationError(`${label}.${sub.key} must have at most ${MAX_OPTION_LIST} entries.`);
  }

  const usedIds = new Set<string>();
  const rows: Record<string, unknown>[] = [];

  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null) {
      throw new ValidationError(`Each entry in ${label}.${sub.key} must be an object.`);
    }
    const row = raw as Record<string, unknown>;
    const optionFields = sub.optionFields ?? [];

    let id = typeof row.id === 'string' && row.id.trim() !== '' ? row.id.trim() : '';
    if (!id) {
      const labelKey =
        typeof row.label === 'string' && row.label.trim() !== '' ? row.label : 'option';
      id = uniqueId(slugify(labelKey), usedIds);
    } else {
      assertSlugId(id, `${label}.${sub.key}`);
      usedIds.add(id);
    }

    const normalized: Record<string, unknown> = { id };
    for (const optSub of optionFields) {
      const normalizedVal = validateSubValue(optSub, row[optSub.key], `${label}.${sub.key}[${id}]`);
      normalized[optSub.key] = normalizedVal;
    }
    rows.push(normalized);
  }

  return rows;
}

function validateSubValue(sub: WebPluginSubField, value: unknown, label: string): FieldValue {
  if (isMultiSubField(sub)) {
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
      throw new ValidationError(`${label}.${sub.key} must be an array of strings.`);
    }
    const normalized = value as string[];
    if (sub.type === 'channel-multi' || sub.type === 'role-multi') {
      assertSnowflakesInArray(normalized, `${label}.${sub.key}`);
    }
    return normalized;
  }
  if (isBooleanSubField(sub)) {
    return value === true;
  }
  if (isOptionListSubField(sub)) {
    return validateOptionList(sub, value, label);
  }
  if (sub.type === 'select') {
    if (typeof value !== 'string') {
      throw new ValidationError(`${label}.${sub.key} must be a string.`);
    }
    if (sub.options?.length && value && !sub.options.some((o) => o.value === value)) {
      throw new ValidationError(`${label}.${sub.key} has an invalid selection.`);
    }
    return value;
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${label}.${sub.key} must be a string.`);
  }
  if (sub.type === 'role' || sub.type === 'channel') {
    assertSnowflake(value, `${label}.${sub.key}`);
  }
  return value;
}

function readObjectListValues(
  field: WebPluginField,
  configData: Record<string, unknown>,
  textsData: Record<string, unknown>
): Record<string, unknown>[] {
  const rows = Array.isArray(configData[field.key]) ? (configData[field.key] as unknown[]) : [];
  const textsKey = field.textsKey ?? 'types';
  const textsMap =
    typeof textsData[textsKey] === 'object' && textsData[textsKey] !== null
      ? (textsData[textsKey] as Record<string, Record<string, unknown>>)
      : {};

  return rows
    .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    .map((row) => {
      const id = typeof row.id === 'string' ? row.id : '';
      const textRow = textsMap[id] ?? {};
      const merged: Record<string, unknown> = {
        id,
        published: row.published === true,
      };

      for (const sub of field.itemFields ?? []) {
        const store = sub.store ?? 'config';
        const source = store === 'texts' ? textRow : row;
        merged[sub.key] = readSubValue(sub, source[sub.key]);
      }
      return merged;
    });
}

export function readEnabled(namespace: string): boolean {
  return readDataJson(namespace, 'config').enabled !== false;
}

export async function writeEnabled(namespace: string, enabled: boolean): Promise<boolean> {
  const existing = readDataJson(namespace, 'config');
  const merged = { ...existing, enabled };
  await writeJsonAtomic(moduleDataPath(namespace, STORE_FILES.config), merged);
  invalidateModuleCache(namespace);
  return enabled;
}

export function readValues(plugin: WebPlugin): Record<string, FieldValue> {
  const parsedByStore: Partial<Record<WebFieldStore, Record<string, unknown>>> = {};
  function parsed(store: WebFieldStore): Record<string, unknown> {
    return (parsedByStore[store] ??= readDataJson(plugin.namespace, store));
  }

  const values: Record<string, FieldValue> = {};
  for (const field of plugin.fields) {
    if (isObjectListField(field)) {
      values[field.key] = readObjectListValues(field, parsed('config'), parsed('texts'));
      continue;
    }

    const current = parsed(field.store)[field.key];
    if (isMultiField(field)) {
      values[field.key] = toStringArray(current);
    } else if (isBooleanField(field)) {
      values[field.key] = current === true;
    } else {
      values[field.key] = typeof current === 'string' ? current : '';
    }
  }
  return values;
}

export class ValidationError extends Error { }

export async function writeValues(
  plugin: WebPlugin,
  input: unknown
): Promise<Record<string, FieldValue>> {
  if (typeof input !== 'object' || input === null) {
    throw new ValidationError('Request body must be a JSON object of field values.');
  }

  const fieldsByKey = new Map(plugin.fields.map((f) => [f.key, f]));
  const incoming = input as Record<string, unknown>;

  const configExisting = readDataJson(plugin.namespace, 'config');
  const textsExisting = readDataJson(plugin.namespace, 'texts');

  const configOut = { ...configExisting };
  const textsOut = { ...textsExisting };
  let configTouched = false;
  let textsTouched = false;

  for (const [key, value] of Object.entries(incoming)) {
    const field = fieldsByKey.get(key);
    if (!field) {
      throw new ValidationError(`Unknown field "${key}" for module "${plugin.namespace}".`);
    }

    if (isObjectListField(field)) {
      if (!Array.isArray(value)) {
        throw new ValidationError(`Field "${key}" must be an array of objects.`);
      }

      const existingRows = Array.isArray(configExisting[field.key])
        ? (configExisting[field.key] as Record<string, unknown>[])
        : [];
      const existingById = new Map(
        existingRows
          .filter((r) => typeof r.id === 'string')
          .map((r) => [r.id as string, r])
      );

      const textsKey = field.textsKey ?? 'types';
      const usedIds = new Set<string>();
      const newConfigRows: Record<string, unknown>[] = [];
      const newTextsMap: Record<string, Record<string, unknown>> = {};

      for (const rawRow of value) {
        if (typeof rawRow !== 'object' || rawRow === null) {
          throw new ValidationError(`Each entry in "${key}" must be an object.`);
        }
        const row = rawRow as Record<string, unknown>;

        let id = typeof row.id === 'string' && row.id.trim() !== '' ? row.id.trim() : '';
        if (!id) {
          const label =
            typeof row.panelTitle === 'string' && row.panelTitle.trim() !== ''
              ? row.panelTitle
              : typeof row.openButtonLabel === 'string' && row.openButtonLabel.trim() !== ''
                ? row.openButtonLabel
                : field.itemLabel ?? 'item';
          id = uniqueId(slugify(label), usedIds);
        } else {
          assertSlugId(id, `${key}[${id}]`);
          usedIds.add(id);
        }

        const prev = existingById.get(id);
        const configRow: Record<string, unknown> = {
          id,
          published: prev?.published === true,
          panelMessageId: typeof prev?.panelMessageId === 'string' ? prev.panelMessageId : '',
        };

        const textRow: Record<string, unknown> = {};

        for (const sub of field.itemFields ?? []) {
          const normalized = validateSubValue(sub, row[sub.key], `${key}[${id}]`);
          const store = sub.store ?? 'config';
          if (store === 'texts') textRow[sub.key] = normalized;
          else configRow[sub.key] = normalized;
        }

        applyClearWhenHidden(field, configRow, textRow);

        if (plugin.namespace === 'custom-embeds' && field.key === 'panels') {
          try {
            validateEmbedPanelRow(configRow, textRow);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Invalid embed panel configuration.';
            throw new ValidationError(`${key}[${id}]: ${message}`);
          }
        }

        if (plugin.namespace === 'reaction-roles' && field.key === 'panels') {
          try {
            validateRolePanelRow(configRow, textRow);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Invalid panel configuration.';
            throw new ValidationError(`${key}[${id}]: ${message}`);
          }
        }

        if (plugin.namespace === 'tickets' && field.key === 'ticketTypes') {
          try {
            validateTicketTypeRow(configRow, textRow);
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Invalid ticket type configuration.';
            throw new ValidationError(`${key}[${id}]: ${message}`);
          }
        }

        newConfigRows.push(configRow);
        newTextsMap[id] = textRow;
      }

      configOut[field.key] = newConfigRows;
      textsOut[textsKey] = newTextsMap;
      configTouched = true;
      textsTouched = true;
      continue;
    }

    let normalized: FieldValue;
    if (isMultiField(field)) {
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
        throw new ValidationError(`Field "${key}" must be an array of strings.`);
      }
      normalized = value as string[];
    } else if (isBooleanField(field)) {
      if (typeof value !== 'boolean') {
        throw new ValidationError(`Field "${key}" must be a boolean.`);
      }
      normalized = value;
    } else {
      if (typeof value !== 'string') {
        throw new ValidationError(`Field "${key}" must be a string.`);
      }
      normalized = value;
    }

    validateDiscordIdField(field.type, normalized, `Field "${key}"`);

    if (field.store === 'config') {
      configOut[field.key] = normalized;
      configTouched = true;
    } else {
      textsOut[field.key] = normalized;
      textsTouched = true;
    }
  }

  if (configTouched) {
    await writeJsonAtomic(moduleDataPath(plugin.namespace, STORE_FILES.config), configOut);
    invalidateModuleCache(plugin.namespace);
  }
  if (textsTouched) {
    await writeJsonAtomic(moduleDataPath(plugin.namespace, STORE_FILES.texts), textsOut);
    invalidateModuleCache(plugin.namespace);
  }

  return readValues(plugin);
}
