import { readFileSync } from "node:fs";
import path from "node:path";
import {
  APP_CONFIG_TABLE,
  MODULE_NAMESPACES,
  moduleTableName,
} from "../../shared/core/moduleTable.js";
import { parseSqlStringLiteral } from "./sqlLiteral.js";
import { closeTursoDb, DEFAULT_TURSO_DB_PATH, openTursoDb } from "./tursoDb.js";

const MIGRATE_TABLES = new Set([
  APP_CONFIG_TABLE,
  ...MODULE_NAMESPACES.map((ns) => moduleTableName(ns)),
]);

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
  if (!valueLit) throw new Error(`Could not parse value for ${table}/${keyLit.value}.`);
  pos = skipWsAndComma(valuesClause, valueLit.end);

  const tsLit = parseSqlStringLiteral(valuesClause, pos);
  if (!tsLit) {
    throw new Error(`Could not parse updated_at for ${table}/${keyLit.value}.`);
  }

  if (table === APP_CONFIG_TABLE && SKIP_APP_CONFIG_KEYS.has(keyLit.value)) {
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

Import app_config + module_* rows from a pg_dump --column-inserts file into Turso.
Default db path: ${DEFAULT_TURSO_DB_PATH}`);
  process.exit(1);
}

async function upsertRow(
  db: Awaited<ReturnType<typeof openTursoDb>>,
  row: ParsedRow,
): Promise<void> {
  const valueText = JSON.stringify(row.value);
  await db
    .prepare(
      `INSERT INTO ${row.table} (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT (key) DO UPDATE
         SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .run(row.key, valueText, row.updatedAtMs);
}

async function printCounts(db: Awaited<ReturnType<typeof openTursoDb>>): Promise<void> {
  console.log("[pg-turso-import] Row counts:");
  const tables = [APP_CONFIG_TABLE, ...MODULE_NAMESPACES.map((ns) => moduleTableName(ns))];
  for (const table of tables) {
    const row = await db
      .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
      .get() as { count: number };
    console.log(`  ${table}: ${row.count}`);
  }
}

async function main(): Promise<void> {
  const dumpPath = process.argv[2];
  const dbPath = process.argv[3] ?? DEFAULT_TURSO_DB_PATH;
  if (!dumpPath) usage();

  const resolvedDump = path.resolve(dumpPath);
  const content = readFileSync(resolvedDump, "utf8");
  const statements = extractInsertStatements(content);
  console.log(`[pg-turso-import] Found ${statements.length} INSERT statement(s) in ${resolvedDump}.`);

  const db = await openTursoDb(path.resolve(dbPath));
  let imported = 0;
  let skipped = 0;

  try {
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

    console.log(`[pg-turso-import] Imported ${imported} row(s), skipped ${skipped}.`);
    await printCounts(db);
  } finally {
    await closeTursoDb(db);
  }
}

main().catch((err) => {
  console.error("[pg-turso-import] failed:", err);
  process.exit(1);
});
