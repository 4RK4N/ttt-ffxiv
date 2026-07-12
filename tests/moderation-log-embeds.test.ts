import { describe, expect, it } from "vitest";
import { resolveDeleteAuthor } from "../bot/src/modules/moderation-log/embeds.js";
import { TEXT_DEFAULTS } from "../bot/src/lib/modules/moderation-log/types.js";

describe("resolveDeleteAuthor", () => {
  it("resolves known authors", () => {
    const author = {
      id: "123",
      username: "alice",
      displayAvatarURL: () => "https://cdn.discordapp.com/avatars/123.png",
    };

    expect(resolveDeleteAuthor(TEXT_DEFAULTS, author)).toEqual({
      mention: "<@123>",
      displayName: "alice",
      iconURL: "https://cdn.discordapp.com/avatars/123.png",
    });
  });

  it("falls back when author is missing", () => {
    expect(resolveDeleteAuthor(TEXT_DEFAULTS, null)).toEqual({
      mention: TEXT_DEFAULTS.authorUnknown,
      displayName: TEXT_DEFAULTS.authorUnknown,
    });
  });
});
