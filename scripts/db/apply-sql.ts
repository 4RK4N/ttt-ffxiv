import { readFileSync } from "node:fs";
import path from "node:path";
import { closeTursoDb, DEFAULT_TURSO_DB_PATH, openTursoDb } from "./tursoDb.js";

function usage(): never {
  console.error(`Usage: apply-sql.ts <db-path> <file.sql>

Apply a SQL file to a Turso database file.
Default db path: ${DEFAULT_TURSO_DB_PATH}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const dbPath = process.argv[2];
  const sqlFile = process.argv[3];
  if (!dbPath || !sqlFile) usage();

  const resolvedSql = path.resolve(sqlFile);
  const sql = readFileSync(resolvedSql, "utf8");
  const db = await openTursoDb(path.resolve(dbPath));

  try {
    await db.exec(sql);
    console.log(`[apply-sql] Applied ${resolvedSql} → ${path.resolve(dbPath)}`);
  } finally {
    await closeTursoDb(db);
  }
}

main().catch((err) => {
  console.error("[apply-sql] failed:", err);
  process.exit(1);
});
