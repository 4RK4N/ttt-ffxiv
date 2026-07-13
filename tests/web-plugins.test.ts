import { describe, expect, it } from "vitest";
import { loadWebPlugins } from "../web-admin/src/plugins.js";

describe("loadWebPlugins", () => {
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
