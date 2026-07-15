import { assertSafeTableName, namespaceFromTable } from "./moduleTable.js";
import { getDb, withTransaction } from "./db.js";
/** Reserved module row keys — not merged into bot runtime data. */
export const RESERVED_MODULE_KEYS = new Set(["editorConfig"]);
function parseStoredValue(raw) {
    if (typeof raw !== "string")
        return raw;
    try {
        return JSON.parse(raw);
    }
    catch {
        return raw;
    }
}
function mergeDefaults(defaults, rows) {
    const out = { ...defaults };
    for (const [key, value] of rows) {
        if (RESERVED_MODULE_KEYS.has(key))
            continue;
        out[key] = value;
    }
    return out;
}
async function loadTableRows(client, table) {
    const stmt = await client.prepare(`SELECT key, value FROM ${table}`);
    const result = (await stmt.all());
    const rows = new Map();
    for (const row of result) {
        rows.set(row.key, parseStoredValue(row.value));
    }
    return rows;
}
async function notifyModuleWrite(table) {
    const namespace = namespaceFromTable(table);
    if (!namespace)
        return;
    const { reloadModuleStore } = await import("./texts.js");
    await reloadModuleStore(namespace);
}
export async function getDbData(table, key) {
    assertSafeTableName(table);
    const stmt = await getDb().prepare(`SELECT value FROM ${table} WHERE key = ?`);
    const row = (await stmt.get(key));
    return row ? parseStoredValue(row.value) : undefined;
}
/** Reads a single key on an open transaction connection. */
export async function getDbDataFromClient(client, table, key) {
    assertSafeTableName(table);
    const stmt = await client.prepare(`SELECT value FROM ${table} WHERE key = ?`);
    const row = (await stmt.get(key));
    return row ? parseStoredValue(row.value) : undefined;
}
export async function getDbDataAll(table, defaults) {
    assertSafeTableName(table);
    const rows = await loadTableRows(getDb(), table);
    if (!defaults) {
        return Object.fromEntries(rows);
    }
    return mergeDefaults(defaults, rows);
}
export async function setDbData(table, key, value, client) {
    assertSafeTableName(table);
    const valueText = JSON.stringify(value);
    const run = async (c) => {
        const stmt = await c.prepare(`INSERT INTO ${table} (key, value)
       VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`);
        await stmt.run(key, valueText);
    };
    if (client) {
        await run(client);
    }
    else {
        await withTransaction(async (c) => run(c));
        await notifyModuleWrite(table);
    }
}
export async function setDbDataMany(table, rows, client) {
    assertSafeTableName(table);
    const run = async (c) => {
        const stmt = await c.prepare(`INSERT INTO ${table} (key, value)
       VALUES (?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value`);
        for (const [key, value] of Object.entries(rows)) {
            await stmt.run(key, JSON.stringify(value));
        }
    };
    if (client) {
        await run(client);
    }
    else {
        await withTransaction(async (c) => run(c));
        await notifyModuleWrite(table);
    }
}
//# sourceMappingURL=dbData.js.map