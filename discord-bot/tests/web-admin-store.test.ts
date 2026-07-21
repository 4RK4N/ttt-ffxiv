import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDb, getDb, initDb } from "../shared/core/db.js";
import { setDbDataMany } from "../shared/core/dbData.js";
import { moduleTableName } from "../shared/core/moduleTable.js";
import { reloadModuleStore } from "../shared/core/texts.js";
import { loadWebPlugins } from "../web-admin/src/plugins.js";
import {
  readEnabled,
  readValues,
  ValidationError,
  writeEnabled,
  writeValues,
} from "../web-admin/src/store.js";

describe("web-admin store", () => {
  let dbPath: string;

  beforeEach(async () => {
    dbPath = join(tmpdir(), `ttt-test-${randomUUID()}.db`);
    await initDb({ dbPath });
    const seed = readFileSync(
      join(process.cwd(), "shared/modules/custom-embeds/seed.sql"),
      "utf8",
    );
    await getDb().exec(seed);
    await reloadModuleStore("custom-embeds");
  });

  afterEach(async () => {
    await closeDb();
    try {
      unlinkSync(dbPath);
    } catch {
      /* ignore */
    }
  });

  async function embedsPlugin() {
    const plugins = await loadWebPlugins();
    const plugin = plugins.find((p) => p.namespace === "custom-embeds");
    expect(plugin).toBeDefined();
    return plugin!;
  }

  it("reads enabled and toggles via writeEnabled", async () => {
    expect(readEnabled("custom-embeds")).toBe(true);
    await writeEnabled("custom-embeds", false);
    await reloadModuleStore("custom-embeds");
    expect(readEnabled("custom-embeds")).toBe(false);
  });

  it("reads and writes embed panel values including clearing footer", async () => {
    const plugin = await embedsPlugin();
    const table = moduleTableName("custom-embeds");
    await setDbDataMany(table, {
      panels: [
        {
          id: "rules",
          published: false,
          panelMessageId: "",
          channelId: "123456789012345678",
          showTimestamp: false,
          panelTitle: "Rules",
          panelDescription: "Body text",
          authorName: "Author",
          authorIconUrl: "",
          footer: "Footer",
        },
      ],
    });
    await reloadModuleStore("custom-embeds");

    const before = readValues(plugin);
    const panels = before.panels as Record<string, unknown>[];
    expect(panels[0]?.footer).toBe("Footer");

    const saved = await writeValues(plugin, {
      panels: [
        {
          ...panels[0],
          footer: "",
          authorName: "",
          panelDescription: "Updated body",
        },
      ],
    });
    await reloadModuleStore("custom-embeds");

    const afterPanels = saved.panels as Record<string, unknown>[];
    expect(afterPanels[0]?.footer).toBe("");
    expect(afterPanels[0]?.authorName).toBe("");
    expect(afterPanels[0]?.panelDescription).toBe("Updated body");
    expect(afterPanels[0]?.panelTitle).toBe("Rules");
  });

  it("rejects unknown fields and invalid body shapes", async () => {
    const plugin = await embedsPlugin();
    await expect(writeValues(plugin, null)).rejects.toBeInstanceOf(
      ValidationError,
    );
    await expect(
      writeValues(plugin, { notAField: "x" }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      writeValues(plugin, { panels: "nope" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
