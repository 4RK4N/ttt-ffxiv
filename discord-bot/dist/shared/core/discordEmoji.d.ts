/** Parses emoji string for ButtonBuilder.setEmoji / select menu options. */
export declare function parseEmoji(emoji: string): {
    name: string;
    id?: string;
} | undefined;
/** Guild emoji names: 2–32 alphanumeric characters or underscores. */
export declare const EMOJI_NAME_RE: RegExp;
export declare function isValidGuildEmojiName(name: string): boolean;
/** True when the input is custom emoji markup with a snowflake id. */
export declare function isCustomEmojiMarkup(emoji: string): boolean;
/** True when custom emoji markup is animated (`<a:name:id>`). */
export declare function isAnimatedCustomEmojiMarkup(emoji: string): boolean;
/** CDN URL for a custom emoji image. */
export declare function customEmojiCdnUrl(id: string, animated: boolean): string;
/** Stable key matching a live Discord reaction emoji. */
export declare function reactionMatchKey(emojiName: string | null, emojiId: string | null): string | undefined;
/** Stable key for duplicate emoji checks (custom id or unicode literal). */
export declare function emojiMatchKey(emoji: string): string | undefined;
/** True when a live reaction matches a configured emoji string. */
export declare function reactionsMatch(configEmoji: string, emojiName: string | null, emojiId: string | null): boolean;
/** URL path segment for Discord reaction API. */
export declare function encodeEmojiForReaction(emoji: string): string | undefined;
//# sourceMappingURL=discordEmoji.d.ts.map