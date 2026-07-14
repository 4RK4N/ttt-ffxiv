import type { Database } from "@tursodatabase/database";
import { assertSafeTableName } from "./moduleTable.js";
import { getDb, withTransaction } from "./db.js";

/** Reserved module row keys — not merged into bot runtime data. */
export const RESERVED_MODULE_KEYS = new Set(["editorConfig"]);

interface TableCacheEntry {
  stampMs: number;
  rows: Map<string, unknown>;
}

const tableCache = new Map<string, TableCacheEntry>();

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

async function loadTableStamp(client: Database, table: string): Promise<number> {
  const stmt = await client.prepare(
    `SELECT MAX(updated_at) AS max FROM ${table}`,
  );
  const row = (await stmt.get()) as { max: number | null } | undefined;
  return row?.max ?? 0;
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

async function refreshCacheIfNeeded(table: string): Promise<TableCacheEntry> {
  assertSafeTableName(table);
  const handle = getDb();
  const stampMs = await loadTableStamp(handle, table);
  const cached = tableCache.get(table);
  if (cached && cached.stampMs === stampMs) {
    return cached;
  }
  const rows = await loadTableRows(handle, table);
  const entry = { stampMs, rows };
  tableCache.set(table, entry);
  return entry;
}

export function invalidateTableCache(table: string): void {
  tableCache.delete(table);
}

export async function getDbData(table: string, key: string): Promise<unknown> {
  const entry = await refreshCacheIfNeeded(table);
  return entry.rows.get(key);
}

/** Reads a single key on an open transaction connection (no cache). */
export async function getDbDataFromClient(
  client: Database,
  table: string,
  key: string,
): Promise<unknown> {
  assertSafeTableName(table);
  const stmt = await client.prepare(
    `SELECT value FROM ${table} WHERE key = ?`,
  );
  const row = (await stmt.get(key)) as { value: unknown } | undefined;
  return row ? parseStoredValue(row.value) : undefined;
}

export async function getDbDataAll(
  table: string,
  defaults?: object,
): Promise<Record<string, unknown>> {
  const entry = await refreshCacheIfNeeded(table);
  if (!defaults) {
    return Object.fromEntries(entry.rows);
  }
  return mergeDefaults(defaults, entry.rows) as Record<string, unknown>;
}

export async function setDbData(
  table: string,
  key: string,
  value: unknown,
  client?: Database,
): Promise<void> {
  assertSafeTableName(table);
  const now = Date.now();
  const valueText = JSON.stringify(value);

  const run = async (c: Database) => {
    const stmt = await c.prepare(
      `INSERT INTO ${table} (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT (key) DO UPDATE
         SET value = excluded.value, updated_at = excluded.updated_at`,
    );
    await stmt.run(key, valueText, now);
  };

  if (client) {
    await run(client);
  } else {
    await withTransaction(async (c) => run(c));
  }
  invalidateTableCache(table);
}

export async function setDbDataMany(
  table: string,
  rows: Record<string, unknown>,
  client?: Database,
): Promise<void> {
  assertSafeTableName(table);
  const now = Date.now();

  const run = async (c: Database) => {
    const stmt = await c.prepare(
      `INSERT INTO ${table} (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT (key) DO UPDATE
         SET value = excluded.value, updated_at = excluded.updated_at`,
    );
    for (const [key, value] of Object.entries(rows)) {
      await stmt.run(key, JSON.stringify(value), now);
    }
  };

  if (client) {
    await run(client);
  } else {
    await withTransaction(async (c) => run(c));
  }
  invalidateTableCache(table);
}

export async function tableIsEmpty(table: string): Promise<boolean> {
  assertSafeTableName(table);
  const stmt = await getDb().prepare(`SELECT COUNT(*) AS count FROM ${table}`);
  const row = (await stmt.get()) as { count: number };
  return row.count === 0;
}
