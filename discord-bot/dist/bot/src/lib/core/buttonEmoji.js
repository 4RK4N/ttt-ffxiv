import { parseEmoji } from "#shared/core/discordEmoji.js";
/** Applies a parsed emoji string to a button, when valid. */
export function applyEmojiToButton(button, emojiString) {
    const parsed = parseEmoji(emojiString);
    if (!parsed)
        return;
    button.setEmoji(parsed.id ? { id: parsed.id, name: parsed.name } : parsed);
}
//# sourceMappingURL=buttonEmoji.js.map