import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODULE_DEFAULTS as customEmbeds } from "../../shared/modules/custom-embeds/types.js";
import { MODULE_DEFAULTS as reactionRoles } from "../../shared/modules/reaction-roles/types.js";
import { MODULE_DEFAULTS as tickets } from "../../shared/modules/tickets/types.js";
import {
  MODULE_NAMESPACES,
  moduleTableName,
  type ModuleNamespace,
} from "../../shared/core/moduleTable.js";
import { MODULE_DEFAULTS as autothread } from "../../bot/src/lib/modules/links-pics-vids-autothread/types.js";
import { MODULE_DEFAULTS as emojis } from "../../bot/src/lib/modules/emojis/types.js";
import { MODULE_DEFAULTS as moderationLog } from "../../bot/src/lib/modules/moderation-log/types.js";
import { MODULE_DEFAULTS as picRepost } from "../../bot/src/lib/modules/pic-repost-commands/types.js";
import { MODULE_DEFAULTS as welcomeMessage } from "../../bot/src/lib/modules/welcome-message/types.js";
import { parseSqlStringLiteral, sqlStringLiteral } from "./sqlLiteral.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const MODULE_SEED_DEFAULTS: Record<ModuleNamespace, Record<string, unknown>> = {
  "welcome-message": seedRows(welcomeMessage),
  "pic-repost-commands": seedRows(picRepost),
  "links-pics-vids-autothread": seedRows(autothread),
  tickets: seedRows(tickets),
  "reaction-roles": seedRows(reactionRoles),
  "custom-embeds": seedRows(customEmbeds),
  "moderation-log": seedRows(moderationLog),
  emojis: seedRows(emojis),
};

function seedRows(data: object): Record<string, unknown> {
  return data as Record<string, unknown>;
}

function upsertRow(table: string, key: string, jsonValue: unknown): string {
  const value = sqlStringLiteral(JSON.stringify(jsonValue));
  const keyLit = sqlStringLiteral(key);
  return (
    `INSERT INTO ${table}(key,value) VALUES(${keyLit},${value}) ` +
    `ON CONFLICT(key) DO UPDATE SET value=excluded.value;`
  );
}

function createTableDdl(table: string): string {
  return (
    `CREATE TABLE IF NOT EXISTS ${table} (\n` +
    `  key   TEXT PRIMARY KEY,\n` +
    `  value TEXT NOT NULL\n` +
    `);`
  );
}

function extractEditorConfigFromSeed(seedPath: string): unknown {
  if (!existsSync(seedPath)) {
    throw new Error(
      `Missing ${seedPath}. editorConfig is preserved from the existing seed.sql file.`,
    );
  }
  const sql = readFileSync(seedPath, "utf8");
  const marker = "VALUES('editorConfig',";
  const start = sql.indexOf(marker);
  if (start === -1) {
    throw new Error(`No editorConfig row found in ${seedPath}.`);
  }
  const quoteStart = start + marker.length;
  const parsed = parseSqlStringLiteral(sql, quoteStart);
  if (!parsed) {
    throw new Error(`Could not parse editorConfig literal in ${seedPath}.`);
  }
  return JSON.parse(parsed.value) as unknown;
}

function generateModuleSeed(namespace: ModuleNamespace): string {
  const table = moduleTableName(namespace);
  const seedPath = path.join(ROOT, "shared", "modules", namespace, "seed.sql");
  const editorConfig = extractEditorConfigFromSeed(seedPath);
  const defaults = MODULE_SEED_DEFAULTS[namespace];

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
