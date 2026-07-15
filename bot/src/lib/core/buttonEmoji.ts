import type { ButtonBuilder } from "discord.js";
import { parseEmoji } from "@shared/core/discordEmoji.js";

/** Applies a parsed emoji string to a button, when valid. */
export function applyEmojiToButton(
  button: ButtonBuilder,
  emojiString: string,
): void {
  const parsed = parseEmoji(emojiString);
  if (!parsed) return;
  button.setEmoji(
    parsed.id ? { id: parsed.id, name: parsed.name } : parsed,
  );
}
