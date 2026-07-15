import { describe, expect, it, vi } from "vitest";

vi.mock("@shared/core/texts.js", () => ({
  isModuleEnabled: vi.fn(() => true),
}));

import { isModuleEnabled } from "@shared/core/texts.js";
import {
  ensureFullReaction,
  guardReactionEvent,
} from "../bot/src/lib/core/reactionContext.js";

describe("guardReactionEvent", () => {
  it("skips bot users", async () => {
    const reaction = {} as Parameters<typeof guardReactionEvent>[0];
    const result = await guardReactionEvent(reaction, { bot: true }, "test");
    expect(result).toBeNull();
  });

  it("skips disabled modules", async () => {
    vi.mocked(isModuleEnabled).mockReturnValueOnce(false);
    const reaction = {} as Parameters<typeof guardReactionEvent>[0];
    const result = await guardReactionEvent(reaction, { bot: false }, "test");
    expect(result).toBeNull();
  });
});

describe("ensureFullReaction", () => {
  it("returns null when message has no guild", async () => {
    const reaction = {
      partial: false,
      message: { partial: false, guild: null },
    } as unknown as Parameters<typeof ensureFullReaction>[0];

    const result = await ensureFullReaction(reaction);
    expect(result).toBeNull();
  });

  it("returns guild context for complete reactions", async () => {
    const guild = { id: "guild-1" };
    const message = { partial: false, guild };
    const reaction = { partial: false, message };

    const result = await ensureFullReaction(
      reaction as unknown as Parameters<typeof ensureFullReaction>[0],
    );
    expect(result).toEqual({ reaction, message, guild });
  });
});
