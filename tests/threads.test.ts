import { describe, expect, it } from "vitest";
import { stripCustomEmoji } from "../bot/src/lib/core/threads.js";

describe("stripCustomEmoji", () => {
  it("removes custom emoji markup", () => {
    expect(stripCustomEmoji("Hello <:party:1234567890> world")).toBe(
      "Hello world",
    );
  });

  it("removes animated custom emoji", () => {
    expect(stripCustomEmoji("Hi <a:wave:9876543210> there")).toBe("Hi there");
  });

  it("collapses whitespace", () => {
    expect(stripCustomEmoji("  spaced   text  ")).toBe("spaced text");
  });
});
