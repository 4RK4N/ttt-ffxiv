import {
  DISCORD_MESSAGE_CONTENT_MAX,
  MAX_PANEL_OPTIONS,
} from "../../shared/core/limits.js";
import {
  assertSlugId,
  assertSnowflake,
  assertSnowflakesInArray,
} from "../../shared/core/discordIds.js";
import { slugify, toStringArray } from "../../shared/core/strings.js";
import { setDbDataMany } from "../../shared/core/dbData.js";
import { moduleTableName } from "../../shared/core/moduleTable.js";
import {
  getModuleRowsSync,
  invalidateModuleCache,
  warmModuleCache,
} from "../../shared/core/texts.js";
import { validateEmbedPanelRow } from "../../shared/modules/custom-embeds/validate.js";
import { validateRolePanelRow } from "../../shared/modules/reaction-roles/validate.js";
import { validateTicketTypeRow } from "../../shared/modules/tickets/validate.js";
import type { WebPlugin, WebPluginField, WebPluginSubField } from "./plugins.js";
import {
  isBooleanField,
  isBooleanSubField,
  isMultiField,
  isMultiSubField,
  isObjectListField,
  isOptionListSubField,
} from "./plugins.js";

export type FieldValue =
  string | string[] | boolean | Record<string, unknown>[];

const MAX_OPTION_LIST = MAX_PANEL_OPTIONS;

function validateSlugId(id: string, label: string): void {
  try {
    assertSlugId(id, label);
  } catch (err) {
    throw new ValidationError(err instanceof Error ? err.message : String(err));
  }
}

function validateSnowflake(value: string, label: string): void {
  try {
    assertSnowflake(value, label);
  } catch (err) {
    throw new ValidationError(err instanceof Error ? err.message : String(err));
  }
}

function validateTextLength(
  value: string,
  label: string,
  maxLength: number = DISCORD_MESSAGE_CONTENT_MAX,
): void {
  if (value.length > maxLength) {
    throw new ValidationError(
      `${label} must be at most ${maxLength} characters.`,
    );
  }
}

function validateSnowflakesInArray(values: string[], label: string): void {
  try {
    assertSnowflakesInArray(values, label);
  } catch (err) {
    throw new ValidationError(err instanceof Error ? err.message : String(err));
  }
}

function validateDiscordIdField(
  type: WebPluginField["type"],
  normalized: FieldValue,
  label: string,
): void {
  if (type === "channel" || type === "role") {
    validateSnowflake(normalized as string, label);
    return;
  }
  if (type === "channel-multi" || type === "role-multi") {
    validateSnowflakesInArray(normalized as string[], label);
  }
}

function readModuleRows(namespace: string): Record<string, unknown> {
  try {
    return getModuleRowsSync(namespace);
  } catch (err) {
    console.warn(
      `[web] Failed to read module "${namespace}" from database.`,
      err,
    );
    throw new DataReadError(
      `Cannot read module "${namespace}" from the database. Run ./scripts/db/db-init.sh.`,
    );
  }
}

export class DataReadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataReadError";
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

function isBlankValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Keeps stored row values when the form POST omits or blanks unchanged fields. */
export function mergeObjectListRow(
  incoming: Record<string, unknown>,
  prev: Record<string, unknown> | undefined,
  itemFields: WebPluginSubField[],
): Record<string, unknown> {
  if (!prev) return incoming;
  const merged: Record<string, unknown> = {
    ...prev,
    ...incoming,
    id: incoming.id ?? prev.id,
  };
  for (const sub of itemFields) {
    const formVal = incoming[sub.key];
    const prevVal = prev[sub.key];
    if (isBlankValue(formVal) && !isBlankValue(prevVal)) {
      merged[sub.key] = prevVal;
    }
  }
  return merged;
}

function isSubFieldVisible(
  sub: WebPluginSubField,
  mergedRow: Record<string, unknown>,
): boolean {
  if (!sub.visibleWhen) return true;
  for (const [watchKey, allowed] of Object.entries(sub.visibleWhen)) {
    const current = mergedRow[watchKey];
    if (typeof current !== "string" || !allowed.includes(current)) return false;
  }
  return true;
}

function clearedSubValue(sub: WebPluginSubField): FieldValue {
  if (isMultiSubField(sub)) return [];
  if (isBooleanSubField(sub)) return false;
  if (isOptionListSubField(sub)) return [];
  return "";
}

function applyClearWhenHidden(
  field: WebPluginField,
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>,
): void {
  const merged = { ...configRow, ...textRow };
  for (const sub of field.itemFields ?? []) {
    if (!sub.clearWhenHidden || !sub.visibleWhen) continue;
    if (isSubFieldVisible(sub, merged)) continue;
    const cleared = clearedSubValue(sub);
    const store = sub.store ?? "config";
    if (store === "texts") textRow[sub.key] = cleared;
    else configRow[sub.key] = cleared;
  }
}

function readSubValue(sub: WebPluginSubField, val: unknown): FieldValue {
  if (isMultiSubField(sub)) return toStringArray(val);
  if (isBooleanSubField(sub)) return val === true;
  if (isOptionListSubField(sub)) {
    if (!Array.isArray(val)) return [];
    return val.filter(
      (v): v is Record<string, unknown> => typeof v === "object" && v !== null,
    );
  }
  return typeof val === "string" ? val : "";
}

function validateOptionList(
  sub: WebPluginSubField,
  value: unknown,
  label: string,
): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(
      `${label}.${sub.key} must be an array of objects.`,
    );
  }
  if (value.length > MAX_OPTION_LIST) {
    throw new ValidationError(
      `${label}.${sub.key} must have at most ${MAX_OPTION_LIST} entries.`,
    );
  }

  const usedIds = new Set<string>();
  const rows: Record<string, unknown>[] = [];

  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) {
      throw new ValidationError(
        `Each entry in ${label}.${sub.key} must be an object.`,
      );
    }
    const row = raw as Record<string, unknown>;
    const optionFields = sub.optionFields ?? [];

    let id =
      typeof row.id === "string" && row.id.trim() !== "" ? row.id.trim() : "";
    if (!id) {
      const labelKey =
        typeof row.label === "string" && row.label.trim() !== ""
          ? row.label
          : "option";
      id = uniqueId(slugify(labelKey), usedIds);
    } else {
      validateSlugId(id, `${label}.${sub.key}`);
      usedIds.add(id);
    }

    const normalized: Record<string, unknown> = { id };
    for (const optSub of optionFields) {
      const normalizedVal = validateSubValue(
        optSub,
        row[optSub.key],
        `${label}.${sub.key}[${id}]`,
      );
      normalized[optSub.key] = normalizedVal;
    }
    rows.push(normalized);
  }

  return rows;
}

function validateSubValue(
  sub: WebPluginSubField,
  value: unknown,
  label: string,
): FieldValue {
  if (isMultiSubField(sub)) {
    if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
      throw new ValidationError(
        `${label}.${sub.key} must be an array of strings.`,
      );
    }
    const normalized = value as string[];
    if (sub.type === "channel-multi" || sub.type === "role-multi") {
      validateSnowflakesInArray(normalized, `${label}.${sub.key}`);
    }
    return normalized;
  }
  if (isBooleanSubField(sub)) {
    return value === true;
  }
  if (isOptionListSubField(sub)) {
    return validateOptionList(sub, value, label);
  }
  if (sub.type === "select") {
    if (typeof value !== "string") {
      throw new ValidationError(`${label}.${sub.key} must be a string.`);
    }
    if (
      sub.options?.length &&
      value &&
      !sub.options.some((o) => o.value === value)
    ) {
      throw new ValidationError(
        `${label}.${sub.key} has an invalid selection.`,
      );
    }
    return value;
  }
  if (typeof value !== "string") {
    throw new ValidationError(`${label}.${sub.key} must be a string.`);
  }
  if (sub.type === "text" || sub.type === "textarea") {
    validateTextLength(
      value,
      `${label}.${sub.key}`,
      sub.maxLength ?? DISCORD_MESSAGE_CONTENT_MAX,
    );
  }
  if (sub.type === "role" || sub.type === "channel") {
    validateSnowflake(value, `${label}.${sub.key}`);
  }
  return value;
}

function readObjectListValues(
  field: WebPluginField,
  moduleData: Record<string, unknown>,
): Record<string, unknown>[] {
  const rows = Array.isArray(moduleData[field.key])
    ? (moduleData[field.key] as unknown[])
    : [];

  return rows
    .filter(
      (row): row is Record<string, unknown> =>
        typeof row === "object" && row !== null,
    )
    .map((row) => {
      const id = typeof row.id === "string" ? row.id : "";
      const merged: Record<string, unknown> = {
        id,
        published: row.published === true,
      };

      for (const sub of field.itemFields ?? []) {
        let val = readSubValue(sub, row[sub.key]);
        const store = sub.store ?? "config";
        if (
          store === "texts" &&
          isBlankValue(val) &&
          field.defaultItem?.[sub.key] !== undefined
        ) {
          val = readSubValue(sub, field.defaultItem[sub.key]);
        }
        merged[sub.key] = val;
      }
      return merged;
    });
}

export function readEnabled(namespace: string): boolean {
  return readModuleRows(namespace).enabled !== false;
}

export async function writeEnabled(
  namespace: string,
  enabled: boolean,
): Promise<boolean> {
  const table = moduleTableName(namespace);
  await setDbDataMany(table, { enabled });
  invalidateModuleCache(namespace);
  await warmModuleCache(namespace);
  return enabled;
}

export function readValues(plugin: WebPlugin): Record<string, FieldValue> {
  const moduleData = readModuleRows(plugin.namespace);
  const values: Record<string, FieldValue> = {};
  for (const field of plugin.fields) {
    if (isObjectListField(field)) {
      values[field.key] = readObjectListValues(field, moduleData);
      continue;
    }

    const current = moduleData[field.key];
    if (isMultiField(field)) {
      values[field.key] = toStringArray(current);
    } else if (isBooleanField(field)) {
      values[field.key] = current === true;
    } else {
      values[field.key] = typeof current === "string" ? current : "";
    }
  }
  return values;
}

export class ValidationError extends Error { }

export async function writeValues(
  plugin: WebPlugin,
  input: unknown,
): Promise<Record<string, FieldValue>> {
  if (typeof input !== "object" || input === null) {
    throw new ValidationError(
      "Request body must be a JSON object of field values.",
    );
  }

  const fieldsByKey = new Map(plugin.fields.map((f) => [f.key, f]));
  const incoming = input as Record<string, unknown>;

  const moduleExisting = readModuleRows(plugin.namespace);
  const patch: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(incoming)) {
    const field = fieldsByKey.get(key);
    if (!field) {
      throw new ValidationError(
        `Unknown field "${key}" for module "${plugin.namespace}".`,
      );
    }

    if (isObjectListField(field)) {
      if (!Array.isArray(value)) {
        throw new ValidationError(
          `Field "${key}" must be an array of objects.`,
        );
      }

      const existingRows = Array.isArray(moduleExisting[field.key])
        ? (moduleExisting[field.key] as Record<string, unknown>[])
        : [];
      const existingById = new Map(
        existingRows
          .filter((r) => typeof r.id === "string")
          .map((r) => [r.id as string, r]),
      );

      const usedIds = new Set<string>();
      const mergedRows: Record<string, unknown>[] = [];

      for (const rawRow of value) {
        if (typeof rawRow !== "object" || rawRow === null) {
          throw new ValidationError(
            `Each entry in "${key}" must be an object.`,
          );
        }
        const row = rawRow as Record<string, unknown>;

        let id =
          typeof row.id === "string" && row.id.trim() !== ""
            ? row.id.trim()
            : "";
        if (!id) {
          const label =
            typeof row.panelTitle === "string" && row.panelTitle.trim() !== ""
              ? row.panelTitle
              : typeof row.openButtonLabel === "string" &&
                row.openButtonLabel.trim() !== ""
                ? row.openButtonLabel
                : (field.itemLabel ?? "item");
          id = uniqueId(slugify(label), usedIds);
        } else {
          validateSlugId(id, `${key}[${id}]`);
          usedIds.add(id);
        }

        const prev = existingById.get(id);
        const itemFields = field.itemFields ?? [];
        const mergedRow = mergeObjectListRow(row, prev, itemFields);
        const configRow: Record<string, unknown> = {
          id,
          published: prev?.published === true,
          panelMessageId:
            typeof prev?.panelMessageId === "string" ? prev.panelMessageId : "",
        };
        const textRow: Record<string, unknown> = {};

        for (const sub of itemFields) {
          const normalized = validateSubValue(
            sub,
            mergedRow[sub.key],
            `${key}[${id}]`,
          );
          const store = sub.store ?? "config";
          if (store === "texts") textRow[sub.key] = normalized;
          else configRow[sub.key] = normalized;
        }

        applyClearWhenHidden(field, configRow, textRow);

        if (plugin.namespace === "custom-embeds" && field.key === "panels") {
          try {
            validateEmbedPanelRow(configRow, textRow);
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "Invalid embed panel configuration.";
            throw new ValidationError(`${key}[${id}]: ${message}`);
          }
        }

        if (plugin.namespace === "reaction-roles" && field.key === "panels") {
          try {
            validateRolePanelRow(configRow, textRow);
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "Invalid panel configuration.";
            throw new ValidationError(`${key}[${id}]: ${message}`);
          }
        }

        if (plugin.namespace === "tickets" && field.key === "ticketTypes") {
          try {
            validateTicketTypeRow(configRow, textRow);
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "Invalid ticket type configuration.";
            throw new ValidationError(`${key}[${id}]: ${message}`);
          }
        }

        mergedRows.push({ ...configRow, ...textRow });
      }

      patch[field.key] = mergedRows;
      continue;
    }

    let normalized: FieldValue;
    if (isMultiField(field)) {
      if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
        throw new ValidationError(
          `Field "${key}" must be an array of strings.`,
        );
      }
      normalized = value as string[];
    } else if (isBooleanField(field)) {
      if (typeof value !== "boolean") {
        throw new ValidationError(`Field "${key}" must be a boolean.`);
      }
      normalized = value;
    } else {
      if (typeof value !== "string") {
        throw new ValidationError(`Field "${key}" must be a string.`);
      }
      if (field.type === "text" || field.type === "textarea") {
        validateTextLength(
          value,
          `Field "${key}"`,
          field.maxLength ?? DISCORD_MESSAGE_CONTENT_MAX,
        );
      }
      normalized = value;
    }

    validateDiscordIdField(field.type, normalized, `Field "${key}"`);
    patch[field.key] = normalized;
  }

  if (Object.keys(patch).length > 0) {
    await setDbDataMany(moduleTableName(plugin.namespace), patch);
    invalidateModuleCache(plugin.namespace);
    await warmModuleCache(plugin.namespace);
  }

  return readValues(plugin);
}
