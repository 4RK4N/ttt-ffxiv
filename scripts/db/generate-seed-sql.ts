import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MODULE_NAMESPACES,
  moduleTableName,
} from "../../shared/core/moduleTable.js";
import { MODULE_SEED_DEFAULTS } from "./moduleSeedDefaults.js";
import { sqlStringLiteral } from "./sqlLiteral.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function upsertRow(table: string, key: string, jsonValue: unknown): string {
  const value = sqlStringLiteral(JSON.stringify(jsonValue));
  const keyLit = sqlStringLiteral(key);
  return (
    `INSERT INTO ${table}(key,value,updated_at) VALUES(${keyLit},${value},0) ` +
    `ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at;`
  );
}

function createTableDdl(table: string): string {
  return (
    `CREATE TABLE IF NOT EXISTS ${table} (\n` +
    `  key        TEXT PRIMARY KEY,\n` +
    `  value      TEXT NOT NULL,\n` +
    `  updated_at INTEGER NOT NULL DEFAULT 0\n` +
    `);`
  );
}

function generateModuleSeed(namespace: string): string {
  const table = moduleTableName(namespace);
  const pluginPath = path.join(
    ROOT,
    "shared",
    "modules",
    namespace,
    "web-plugin.json",
  );
  const editorConfig = JSON.parse(readFileSync(pluginPath, "utf8"));
  const defaults = MODULE_SEED_DEFAULTS[namespace as keyof typeof MODULE_SEED_DEFAULTS];

  const lines = [
    `-- One-time seed for ${namespace} (SQLite/Turso). Do not re-run on a populated DB.`,
    createTableDdl(table),
    "",
    upsertRow(table, "editorConfig", editorConfig),
  ];

  for (const [key, value] of Object.entries(defaults)) {
    lines.push(upsertRow(table, key, value));
  }

  return `${lines.join("\n")}\n`;
}

function main(): void {
  for (const namespace of MODULE_NAMESPACES) {
    const outPath = path.join(
      ROOT,
      "shared",
      "modules",
      namespace,
      "seed.sql",
    );
    const sql = generateModuleSeed(namespace);
    writeFileSync(outPath, sql, "utf8");
    console.log(`[generate-seed-sql] wrote ${outPath}`);
  }
}

main();
