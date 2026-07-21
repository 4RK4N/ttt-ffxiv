import { readFileSync } from "node:fs";
import path from "node:path";
import { connect, type Database } from "@tursodatabase/database";
import { resolveDataDir } from "./dataDir.js";

const DATA_DIR = resolveDataDir();
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const REPO_ROOT = path.dirname(DATA_DIR);

export interface DbBootstrapConfig {
  dbPath: string;
}

export interface InitDbOptions {
  /** Open without a write lock — safe while the bot holds the DB (deploy, dump). */
  readonly?: boolean;
  fileMustExist?: boolean;
}

let db: Database | null = null;

export function loadDbBootstrapConfig(): DbBootstrapConfig {
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as Record<
      string,
      unknown
    >;
  } catch (err) {
    throw new Error(
      `Could not read DB bootstrap config from "${CONFIG_FILE}". ` +
        'Copy "data/config.example.json" to "data/config.json". ' +
        `(${err instanceof Error ? err.message : String(err)})`,
      { cause: err },
    );
  }

  const dbPath =
    typeof raw.dbPath === "string" && raw.dbPath.trim() !== ""
      ? raw.dbPath.trim()
      : "data/ttt.db";

  return {
    dbPath: path.isAbsolute(dbPath) ? dbPath : path.resolve(REPO_ROOT, dbPath),
  };
}

export async function initDb(
  bootstrap: DbBootstrapConfig = loadDbBootstrapConfig(),
  options?: InitDbOptions,
): Promise<Database> {
  if (db) return db;
  const connectOptions =
    options?.readonly === true
      ? { readonly: true, fileMustExist: options.fileMustExist ?? true }
      : undefined;
  db = await connect(bootstrap.dbPath, connectOptions);
  return db;
}

export function getDb(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (!db) return;
  const current = db;
  db = null;
  await current.close();
}

export async function withTransaction<T>(
  fn: (client: Database) => Promise<T>,
): Promise<T> {
  const client = getDb();
  await client.exec("BEGIN");
  try {
    const result = await fn(client);
    await client.exec("COMMIT");
    return result;
  } catch (err) {
    await client.exec("ROLLBACK");
    throw err;
  }
}
