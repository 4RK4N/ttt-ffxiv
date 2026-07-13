import { describe, expect, it } from "vitest";
import {
  DISCORD_MESSAGE_CONTENT_MAX,
  resolveFieldMaxLength,
} from "../shared/core/limits.js";

describe("resolveFieldMaxLength", () => {
  it("defaults to Discord plain message limit", () => {
    expect(resolveFieldMaxLength()).toBe(DISCORD_MESSAGE_CONTENT_MAX);
    expect(resolveFieldMaxLength(undefined)).toBe(DISCORD_MESSAGE_CONTENT_MAX);
  });

  it("uses configured max when set", () => {
    expect(resolveFieldMaxLength(4096)).toBe(4096);
  });
});
