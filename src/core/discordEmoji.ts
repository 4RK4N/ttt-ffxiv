/** Parses emoji string for ButtonBuilder.setEmoji / select menu options. */
export function parseEmoji(emoji: string): { name: string } | undefined {
  const trimmed = emoji.trim();
  if (!trimmed) return undefined;
  const custom = trimmed.match(/^<a?:(\w+):\d+>$/);
  if (custom) return { name: custom[1] };
  return { name: trimmed };
}

export function parseCustomEmojiId(emoji: string): string | undefined {
  const match = emoji.trim().match(/^<a?:(\w+):(\d+)>$/);
  return match?.[2];
}

/** Stable key for duplicate emoji checks (custom id or unicode literal). */
export function emojiMatchKey(emoji: string): string | undefined {
  const trimmed = emoji.trim();
  if (!trimmed) return undefined;
  const customId = parseCustomEmojiId(trimmed);
  if (customId) return `custom:${customId}`;
  return `unicode:${trimmed}`;
}

/** URL path segment for Discord reaction API. */
export function encodeEmojiForReaction(emoji: string): string | undefined {
  const trimmed = emoji.trim();
  if (!trimmed) return undefined;
  const custom = trimmed.match(/^<a?:(\w+):(\d+)>$/);
  if (custom) return encodeURIComponent(`${custom[1]}:${custom[2]}`);
  return encodeURIComponent(trimmed);
}
