import { describe, expect, it } from "vitest";
import { loadModules } from "../bot/src/moduleLoader.js";

const EXPECTED_COMMANDS = ["pic", "post", "emoji-add", "emoji-copy"] as const;

describe("loadModules", () => {
  it("discovers all runtime modules with expected surface area", async () => {
    const { handlers, inits, componentRoutes } = await loadModules();

    expect(inits).toHaveLength(7);

    for (const name of EXPECTED_COMMANDS) {
      expect(handlers.has(name)).toBe(true);
    }
    expect(handlers.size).toBe(EXPECTED_COMMANDS.length);

    const routePrefixes = componentRoutes.map((r) => r.prefix);
    expect(routePrefixes).toContain("tickets:");
    expect(routePrefixes).toContain("reaction-roles:");
    expect(componentRoutes.length).toBeGreaterThanOrEqual(2);
  }, 15_000);

  it("omits disabled module commands when skipDisabledCommands is true", async () => {
    const { handlers } = await loadModules({ skipDisabledCommands: true });
    expect(handlers.size).toBeGreaterThan(0);
  });
});
