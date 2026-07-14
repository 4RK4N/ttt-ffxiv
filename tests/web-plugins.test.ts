import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb, initDb } from "../shared/core/db.js";
import { loadWebPlugins } from "../web-admin/src/plugins.js";

describe("loadWebPlugins", () => {
  let dbPath: string;

  beforeEach(async () => {
    dbPath = join(tmpdir(), `ttt-test-${randomUUID()}.db`);
    await initDb({ dbPath });
    const seed = readFileSync(
      join(process.cwd(), "shared/modules/tickets/seed.sql"),
      "utf8",
    );
    await getDb().exec(seed);
  });

  afterEach(async () => {
    await closeDb();
    try {
      unlinkSync(dbPath);
    } catch {
      /* ignore */
    }
  });

  it("sets ticketWelcome maxLength to 4096 for embed-mode welcome text", async () => {
    const plugins = await loadWebPlugins();
    const tickets = plugins.find((p) => p.namespace === "tickets");
    expect(tickets).toBeDefined();

    const ticketTypes = tickets!.fields.find((f) => f.key === "ticketTypes");
    expect(ticketTypes?.type).toBe("object-list");

    const welcome = ticketTypes?.itemFields?.find(
      (f) => f.key === "ticketWelcome",
    );
    expect(welcome?.maxLength).toBe(4096);
  });
});
