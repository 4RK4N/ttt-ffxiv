import { unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb, initDb, withTransaction } from "../shared/core/db.js";
import {
  getDbData,
  setDbData,
  setDbDataMany,
} from "../shared/core/dbData.js";
import {
  getModuleRowsSync,
  warmModuleCache,
} from "../shared/core/texts.js";
import { moduleTableName } from "../shared/core/moduleTable.js";

describe("Turso dbData", () => {
  let dbPath: string;
  const namespace = "welcome-message";
  const table = moduleTableName(namespace);

  beforeEach(async () => {
    dbPath = join(tmpdir(), `ttt-test-${randomUUID()}.db`);
    await initDb({ dbPath });
    await getDb().exec(
      `CREATE TABLE ${table} (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL DEFAULT 0
      );`,
    );
  });

  afterEach(async () => {
    await closeDb();
    try {
      unlinkSync(dbPath);
    } catch {
      /* ignore */
    }
  });

  it("filters editorConfig from module runtime cache", async () => {
    await setDbDataMany(table, {
      editorConfig: { title: "Welcome", fields: [] },
      enabled: true,
      channelId: "123",
    });

    await warmModuleCache(namespace);
    const rows = getModuleRowsSync(namespace);
    expect(rows.editorConfig).toBeUndefined();
    expect(rows.enabled).toBe(true);
    expect(rows.channelId).toBe("123");
  });

  it("stores and reads values via getDbData", async () => {
    await setDbData(table, "botName", "TTT");
    expect(await getDbData(table, "botName")).toBe("TTT");
  });

  it("rolls back failed withTransaction", async () => {
    await setDbData(table, "enabled", true);

    await expect(
      withTransaction(async (db) => {
        const stmt = await db.prepare(
          `INSERT INTO ${table}(key, value, updated_at) VALUES('channelId', ?, ?)`,
        );
        await stmt.run(JSON.stringify("999"), Date.now());
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(await getDbData(table, "channelId")).toBeUndefined();
    expect(await getDbData(table, "enabled")).toBe(true);
  });
});
