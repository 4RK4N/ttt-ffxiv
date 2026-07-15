import { readFileSync } from "node:fs";
import path from "node:path";
import { connect } from "@tursodatabase/database";
import { resolveDataDir } from "./dataDir.js";
const DATA_DIR = resolveDataDir();
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const REPO_ROOT = path.dirname(DATA_DIR);
let db = null;
export function loadDbBootstrapConfig() {
    let raw;
    try {
        raw = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
    }
    catch (err) {
        throw new Error(`Could not read DB bootstrap config from "${CONFIG_FILE}". ` +
            'Copy "data/config.example.json" to "data/config.json". ' +
            `(${err.message})`);
    }
    const dbPath = typeof raw.dbPath === "string" && raw.dbPath.trim() !== ""
        ? raw.dbPath.trim()
        : "data/ttt.db";
    return {
        dbPath: path.isAbsolute(dbPath) ? dbPath : path.resolve(REPO_ROOT, dbPath),
    };
}
export async function initDb(bootstrap = loadDbBootstrapConfig(), options) {
    if (db)
        return db;
    const connectOptions = options?.readonly === true
        ? { readonly: true, fileMustExist: options.fileMustExist ?? true }
        : undefined;
    db = await connect(bootstrap.dbPath, connectOptions);
    return db;
}
export function getDb() {
    if (!db) {
        throw new Error("Database not initialized. Call initDb() first.");
    }
    return db;
}
export async function closeDb() {
    if (!db)
        return;
    const current = db;
    db = null;
    await current.close();
}
export async function withTransaction(fn) {
    const client = getDb();
    await client.exec("BEGIN");
    try {
        const result = await fn(client);
        await client.exec("COMMIT");
        return result;
    }
    catch (err) {
        await client.exec("ROLLBACK");
        throw err;
    }
}
//# sourceMappingURL=db.js.map