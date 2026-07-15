import { ButtonBuilder } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { applyEmojiToButton } from "../bot/src/lib/core/buttonEmoji.js";

describe("applyEmojiToButton", () => {
  it("sets unicode emoji when parse succeeds", () => {
    const button = new ButtonBuilder();
    const setEmoji = vi.spyOn(button, "setEmoji");
    applyEmojiToButton(button, "✅");
    expect(setEmoji).toHaveBeenCalled();
  });

  it("sets custom emoji when markup includes an id", () => {
    const button = new ButtonBuilder();
    const setEmoji = vi.spyOn(button, "setEmoji");
    applyEmojiToButton(button, "<:test:123456789012345678>");
    expect(setEmoji).toHaveBeenCalledWith({
      id: "123456789012345678",
      name: "test",
    });
  });

  it("skips empty emoji strings", () => {
    const button = new ButtonBuilder();
    const setEmoji = vi.spyOn(button, "setEmoji");
    applyEmojiToButton(button, "");
    expect(setEmoji).not.toHaveBeenCalled();
  });
});
