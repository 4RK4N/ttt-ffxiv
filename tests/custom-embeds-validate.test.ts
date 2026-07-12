import { describe, expect, it } from "vitest";
import { validateEmbedPanel } from "../shared/modules/custom-embeds/validate.js";
import type { ResolvedEmbedPanel } from "../shared/modules/custom-embeds/types.js";

function basePanel(
  overrides: Partial<ResolvedEmbedPanel> = {},
): ResolvedEmbedPanel {
  return {
    id: "info",
    published: true,
    panelMessageId: "",
    channelId: "123456789012345678",
    showTimestamp: false,
    panelTitle: "Info",
    panelDescription: "Welcome to the server.",
    authorName: "",
    authorIconUrl: "",
    footer: "",
    ...overrides,
  };
}

describe("validateEmbedPanel", () => {
  it("accepts a complete embed panel", () => {
    expect(() => validateEmbedPanel(basePanel())).not.toThrow();
  });

  it("requires embed description", () => {
    expect(() =>
      validateEmbedPanel(basePanel({ panelDescription: "  " })),
    ).toThrow(/description is required/i);
  });

  it("requires author name when icon URL is set", () => {
    expect(() =>
      validateEmbedPanel(
        basePanel({
          authorIconUrl: "https://example.com/icon.png",
          authorName: "",
        }),
      ),
    ).toThrow(/author name is required/i);
  });

  it("rejects invalid author icon URLs", () => {
    expect(() =>
      validateEmbedPanel(
        basePanel({
          authorName: "Bot",
          authorIconUrl: "not-a-url",
        }),
      ),
    ).toThrow(/valid http or https/i);
  });
});
