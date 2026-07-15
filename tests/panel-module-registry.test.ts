import { describe, expect, it } from "vitest";
import {
  PANEL_MODULE_NAMESPACES,
  PANEL_MODULE_REGISTRY,
  panelListField,
} from "@shared/core/panelModuleRegistry.js";

describe("panelModuleRegistry", () => {
  it("lists all panel modules with list fields", () => {
    expect(PANEL_MODULE_NAMESPACES).toEqual([
      "custom-embeds",
      "reaction-roles",
      "tickets",
    ]);
    expect(PANEL_MODULE_REGISTRY).toHaveLength(3);
  });

  it("resolves list field by namespace", () => {
    expect(panelListField("tickets")).toBe("ticketTypes");
    expect(panelListField("custom-embeds")).toBe("panels");
    expect(panelListField("unknown")).toBeUndefined();
  });
});
