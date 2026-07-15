/** Parses emoji string for ButtonBuilder.setEmoji / select menu options. */
export function parseEmoji(emoji) {
    const trimmed = emoji.trim();
    if (!trimmed)
        return undefined;
    const custom = trimmed.match(/^<a?:(\w+):(\d+)>$/);
    if (custom)
        return { name: custom[1], id: custom[2] };
    return { name: trimmed };
}
/** Guild emoji names: 2–32 alphanumeric characters or underscores. */
export const EMOJI_NAME_RE = /^[a-zA-Z0-9_]{2,32}$/;
export function isValidGuildEmojiName(name) {
    return EMOJI_NAME_RE.test(name);
}
/** True when the input is custom emoji markup with a snowflake id. */
export function isCustomEmojiMarkup(emoji) {
    return parseEmoji(emoji)?.id !== undefined;
}
/** True when custom emoji markup is animated (`<a:name:id>`). */
export function isAnimatedCustomEmojiMarkup(emoji) {
    return /^<a:\w+:\d+>$/.test(emoji.trim());
}
/** CDN URL for a custom emoji image. */
export function customEmojiCdnUrl(id, animated) {
    return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`;
}
function parseCustomEmojiId(emoji) {
    const match = emoji.trim().match(/^<a?:(\w+):(\d+)>$/);
    return match?.[2];
}
/** Strip variation selectors so 🗑 and 🗑️ match the same reaction. */
function normalizeUnicodeEmoji(name) {
    return name.normalize("NFC").replace(/\uFE0F/g, "");
}
/** Stable key matching a live Discord reaction emoji. */
export function reactionMatchKey(emojiName, emojiId) {
    if (emojiId)
        return `custom:${emojiId}`;
    if (emojiName)
        return `unicode:${normalizeUnicodeEmoji(emojiName)}`;
    return undefined;
}
/** Stable key for duplicate emoji checks (custom id or unicode literal). */
export function emojiMatchKey(emoji) {
    const trimmed = emoji.trim();
    if (!trimmed)
        return undefined;
    const customId = parseCustomEmojiId(trimmed);
    if (customId)
        return `custom:${customId}`;
    return `unicode:${normalizeUnicodeEmoji(trimmed)}`;
}
/** True when a live reaction matches a configured emoji string. */
export function reactionsMatch(configEmoji, emojiName, emojiId) {
    const configKey = emojiMatchKey(configEmoji);
    const reactionKey = reactionMatchKey(emojiName, emojiId);
    return !!configKey && configKey === reactionKey;
}
/** URL path segment for Discord reaction API. */
export function encodeEmojiForReaction(emoji) {
    const trimmed = emoji.trim();
    if (!trimmed)
        return undefined;
    const custom = trimmed.match(/^<a?:(\w+):(\d+)>$/);
    if (custom)
        return encodeURIComponent(`${custom[1]}:${custom[2]}`);
    return encodeURIComponent(trimmed);
}
//# sourceMappingURL=discordEmoji.js.map