import path from "node:path";
import { connect, type Database } from "@tursodatabase/database";

export const DEFAULT_TURSO_DB_PATH = path.resolve(process.cwd(), "data", "ttt.db");

export async function openTursoDb(
  dbPath: string = DEFAULT_TURSO_DB_PATH,
): Promise<Database> {
  return connect(dbPath);
}

export async function closeTursoDb(db: Database): Promise<void> {
  await db.close();
}
