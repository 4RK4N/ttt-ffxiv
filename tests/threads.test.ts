import { describe, expect, it } from "vitest";
import {
  stripCustomEmoji,
  extractFirstMentionId,
} from "../bot/src/lib/core/threads.js";

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

describe("extractFirstMentionId", () => {
  it("extracts the first user mention", () => {
    expect(extractFirstMentionId("Welcome <@123456789012345678>")).toBe(
      "123456789012345678",
    );
    expect(extractFirstMentionId("Hi <@!987654321098765432> there")).toBe(
      "987654321098765432",
    );
  });

  it("returns null when no mention is present", () => {
    expect(extractFirstMentionId("No mentions here")).toBeNull();
  });
});
