import type { Database } from "@tursodatabase/database";
import { assertSafeTableName, namespaceFromTable } from "./moduleTable.js";
import { getDb, withTransaction } from "./db.js";

/** Reserved module row keys — not merged into bot runtime data. */
export const RESERVED_MODULE_KEYS = new Set(["editorConfig"]);

function parseStoredValue(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function mergeDefaults<T extends object>(
  defaults: T,
  rows: Map<string, unknown>,
): T {
  const out = { ...defaults } as Record<string, unknown>;
  for (const [key, value] of rows) {
    if (RESERVED_MODULE_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out as T;
}

async function loadTableRows(
  client: Database,
  table: string,
): Promise<Map<string, unknown>> {
  const stmt = await client.prepare(`SELECT key, value FROM ${table}`);
  const result = (await stmt.all()) as Array<{ key: string; value: unknown }>;
  const rows = new Map<string, unknown>();
  for (const row of result) {
    rows.set(row.key, parseStoredValue(row.value));
  }
  return rows;
}

async function notifyModuleWrite(table: string): Promise<void> {
  const namespace = namespaceFromTable(table);
  if (!namespace) return;
  const { reloadModuleStore } = await import("./texts.js");
  await reloadModuleStore(namespace);
}

export async function getDbData(table: string, key: string): Promise<unknown> {
  assertSafeTableName(table);
  const stmt = await getDb().prepare(
    `SELECT value FROM ${table} WHERE key = ?`,
  );
  const row = (await stmt.get(key)) as { value: unknown } | undefined;
  return row ? parseStoredValue(row.value) : undefined;
}

/** Reads a single key on an open transaction connection. */
export async function getDbDataFromClient(
  client: Database,
  table: string,
  key: string,
): Promise<unknown> {
  assertSafeTableName(table);
  const stmt = await client.prepare(`SELECT value FROM ${table} WHERE key = ?`);
  const row = (await stmt.get(key)) as { value: unknown } | undefined;
  return row ? parseStoredValue(row.value) : undefined;
}

export async function getDbDataAll(
  table: string,
  defaults?: object,
): Promise<Record<string, unknown>> {
  assertSafeTableName(table);
  const rows = await loadTableRows(getDb(), table);
  if (!defaults) {
    return Object.fromEntries(rows);
  }
  return mergeDefaults(defaults, rows) as Record<string, unknown>;
}

export async function setDbData(
  table: string,
  key: string,
  value: unknown,
  client?: Database,
): Promise<void> {
  assertSafeTableName(table);
  const valueText = JSON.stringify(value);

  const run = async (c: Database) => {
    const stmt = await c.prepare(
      `INSERT INTO ${table} (key, value)
       VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    );
    await stmt.run(key, valueText);
  };

  if (client) {
    await run(client);
  } else {
    await withTransaction(async (c) => run(c));
    await notifyModuleWrite(table);
  }
}

export async function setDbDataMany(
  table: string,
  rows: Record<string, unknown>,
  client?: Database,
): Promise<void> {
  assertSafeTableName(table);

  const run = async (c: Database) => {
    const stmt = await c.prepare(
      `INSERT INTO ${table} (key, value)
       VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    );
    for (const [key, value] of Object.entries(rows)) {
      await stmt.run(key, JSON.stringify(value));
    }
  };

  if (client) {
    await run(client);
  } else {
    await withTransaction(async (c) => run(c));
    await notifyModuleWrite(table);
  }
}
