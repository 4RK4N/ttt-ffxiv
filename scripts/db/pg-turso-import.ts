import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Database } from "@tursodatabase/database";
import { RESERVED_MODULE_KEYS } from "../../shared/core/dbData.js";
import {
  APP_CONFIG_TABLE,
  MODULE_NAMESPACES,
  moduleTableName,
} from "../../shared/core/moduleTable.js";
import { parseSqlStringLiteral } from "./sqlLiteral.js";
import {
  closeTursoDb,
  DEFAULT_TURSO_DB_PATH,
  openTursoDb,
} from "./tursoDb.js";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const MIGRATE_TABLES = new Set([
  APP_CONFIG_TABLE,
  ...MODULE_NAMESPACES.map((ns) => moduleTableName(ns)),
]);

/** Obsolete Postgres-era keys — not used after Turso cutover. */
const SKIP_APP_CONFIG_KEYS = new Set([
  "internalApiSecret",
  "internalApiPort",
  "internalApiBind",
  "botInternalApiUrl",
]);

const INSERT_HEAD =
  /^INSERT INTO public\.(\w+) \(key, value, updated_at\) VALUES \(/;

interface ParsedRow {
  table: string;
  key: string;
  value: unknown;
  updatedAtMs: number;
}

function skipWsAndComma(input: string, pos: number): number {
  let i = pos;
  while (i < input.length && /\s/.test(input[i])) i++;
  if (input[i] === ",") i++;
  while (i < input.length && /\s/.test(input[i])) i++;
  return i;
}

function findStatementEnd(content: string, searchFrom: number): number {
  let inString = false;
  for (let i = searchFrom; i < content.length - 1; i++) {
    const ch = content[i];
    if (inString) {
      if (ch === "'") {
        if (content[i + 1] === "'") {
          i++;
          continue;
        }
        inString = false;
      }
      continue;
    }
    if (ch === "'") {
      inString = true;
      continue;
    }
    if (ch === ")" && content[i + 1] === ";") {
      return i + 2;
    }
  }
  throw new Error("Unterminated INSERT statement in dump.");
}

function parseTimestampMs(raw: string): number {
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : Date.now();
}

function shouldSkipRow(table: string, key: string): boolean {
  if (table === APP_CONFIG_TABLE && SKIP_APP_CONFIG_KEYS.has(key)) {
    return true;
  }
  if (table !== APP_CONFIG_TABLE && RESERVED_MODULE_KEYS.has(key)) {
    return true;
  }
  return false;
}

function parseInsertStatement(statement: string): ParsedRow | null {
  const head = INSERT_HEAD.exec(statement);
  if (!head) return null;

  const table = head[1];
  if (!MIGRATE_TABLES.has(table)) return null;

  const valuesStart = head.index + head[0].length;
  const valuesEnd = statement.lastIndexOf(")");
  if (valuesEnd < valuesStart) {
    throw new Error(`Malformed INSERT for table ${table}.`);
  }
  const valuesClause = statement.slice(valuesStart, valuesEnd);

  let pos = 0;
  const keyLit = parseSqlStringLiteral(valuesClause, pos);
  if (!keyLit) throw new Error(`Could not parse key in ${table} INSERT.`);
  pos = skipWsAndComma(valuesClause, keyLit.end);

  const valueLit = parseSqlStringLiteral(valuesClause, pos);
  if (!valueLit) {
    throw new Error(`Could not parse value for ${table}/${keyLit.value}.`);
  }
  pos = skipWsAndComma(valuesClause, valueLit.end);

  const tsLit = parseSqlStringLiteral(valuesClause, pos);
  if (!tsLit) {
    throw new Error(`Could not parse updated_at for ${table}/${keyLit.value}.`);
  }

  if (shouldSkipRow(table, keyLit.value)) {
    return null;
  }

  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(valueLit.value);
  } catch {
    parsedValue = valueLit.value;
  }

  return {
    table,
    key: keyLit.value,
    value: parsedValue,
    updatedAtMs: parseTimestampMs(tsLit.value),
  };
}

function extractInsertStatements(content: string): string[] {
  const marker = "INSERT INTO public.";
  const statements: string[] = [];
  let searchFrom = 0;

  while (true) {
    const idx = content.indexOf(marker, searchFrom);
    if (idx < 0) break;

    const end = findStatementEnd(content, idx);
    statements.push(content.slice(idx, end));
    searchFrom = end;
  }

  return statements;
}

function usage(): never {
  console.error(`Usage: pg-turso-import.ts <pg-dump.sql> [db-path]

One-time import from pg_dump --column-inserts into Turso.
Upserts app_config + module_* rows; skips internal-API app_config keys
and module editorConfig (keeps existing seed editor schemas).

Default db path: ${DEFAULT_TURSO_DB_PATH}
Creates the DB file if missing. Applies schema + module seeds when tables are absent.`);
  process.exit(1);
}

async function tableExists(db: Database, name: string): Promise<boolean> {
  const stmt = await db.prepare(
    `SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?`,
  );
  const row = (await stmt.get(name)) as { ok: number } | undefined;
  return row != null;
}

async function applySqlFile(db: Database, sqlPath: string): Promise<void> {
  const sql = readFileSync(sqlPath, "utf8");
  await db.exec(sql);
  console.log(`[pg-turso-import] Applied ${path.relative(ROOT, sqlPath)}`);
}

/** Idempotent: schema.sql + per-module seed.sql (editorConfig lives in seeds). */
async function ensureDbSkeleton(db: Database): Promise<void> {
  if (await tableExists(db, APP_CONFIG_TABLE)) {
    return;
  }

  console.log(
    "[pg-turso-import] Tables missing — applying base schema and module seeds...",
  );

  const schemaPath = path.join(ROOT, "scripts/db/schema.sql");
  if (!existsSync(schemaPath)) {
    throw new Error(`Missing ${schemaPath} in bot image. Rebuild: ./scripts/build.sh bot`);
  }
  await applySqlFile(db, schemaPath);

  const modulesDir = path.join(ROOT, "shared/modules");
  let seedCount = 0;
  for (const entry of readdirSync(modulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const seedPath = path.join(modulesDir, entry.name, "seed.sql");
    if (!existsSync(seedPath)) continue;
    await applySqlFile(db, seedPath);
    seedCount++;
  }

  if (seedCount === 0) {
    throw new Error(
      "No shared/modules/*/seed.sql in bot image. Rebuild: ./scripts/build.sh bot",
    );
  }
}

async function upsertRow(
  db: Awaited<ReturnType<typeof openTursoDb>>,
  row: ParsedRow,
): Promise<void> {
  const stmt = await db.prepare(
    `INSERT INTO ${row.table} (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT (key) DO UPDATE
       SET value = excluded.value, updated_at = excluded.updated_at`,
  );
  await stmt.run(row.key, JSON.stringify(row.value), row.updatedAtMs);
}

async function printCounts(
  db: Awaited<ReturnType<typeof openTursoDb>>,
): Promise<void> {
  console.log("[pg-turso-import] Row counts:");
  const tables = [
    APP_CONFIG_TABLE,
    ...MODULE_NAMESPACES.map((ns) => moduleTableName(ns)),
  ];
  for (const table of tables) {
    const stmt = await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`);
    const row = (await stmt.get()) as { count: number };
    console.log(`  ${table}: ${row.count}`);
  }
}

async function main(): Promise<void> {
  const dumpPath = process.argv[2];
  const dbPath = path.resolve(process.argv[3] ?? DEFAULT_TURSO_DB_PATH);
  if (!dumpPath) usage();

  if (!existsSync(dbPath)) {
    console.log(`[pg-turso-import] Creating ${dbPath} ...`);
  }

  const resolvedDump = path.resolve(dumpPath);
  const content = readFileSync(resolvedDump, "utf8");
  const statements = extractInsertStatements(content);
  console.log(
    `[pg-turso-import] Found ${statements.length} INSERT statement(s) in ${resolvedDump}.`,
  );

  const db = await openTursoDb(dbPath);
  let imported = 0;
  let skipped = 0;

  try {
    await ensureDbSkeleton(db);

    await db.exec("BEGIN");
    try {
      for (const statement of statements) {
        const row = parseInsertStatement(statement);
        if (!row) {
          skipped++;
          continue;
        }
        await upsertRow(db, row);
        imported++;
      }
      await db.exec("COMMIT");
    } catch (err) {
      await db.exec("ROLLBACK");
      throw err;
    }

    console.log(
      `[pg-turso-import] Imported ${imported} row(s), skipped ${skipped}.`,
    );
    await printCounts(db);
  } finally {
    await closeTursoDb(db);
  }
}

main().catch((err) => {
  console.error("[pg-turso-import] failed:", err);
  process.exit(1);
});
