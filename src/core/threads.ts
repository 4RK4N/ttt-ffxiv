const THREAD_NAME_MAX = 100; // Discord's hard limit for thread names.

// Default bilingual opener for comments threads. Each thread module keeps its own
// editable copy in its texts.json; this constant is the seed/fallback for them.
export const DEFAULT_THREAD_FIRST_MESSAGE =
  'Please comment here in the thread to not clutter the channel.\n\n' +
  'Bitte hier im Thread kommentieren um nicht den Channel zu überlasten.';

export const THREAD_AUTO_ARCHIVE_MINUTES = 10080; // 7 days

// Custom (server) emoji are sent as "<:name:id>" or "<a:name:id>". They render as
// literal text in thread names, so we strip them. Standard unicode emoji are kept.
const CUSTOM_EMOJI_REGEX = /<a?:\w+:\d+>/g;

/**
 * Derives a thread name in the form "name - text": strips custom emoji,
 * collapses whitespace to a single line, and truncates to Discord's limit,
 * appending "..." when truncated.
 *
 * When `text` is blank (e.g. a link- or attachment-only post), the name is used
 * on its own with no trailing " - ".
 */
export function buildThreadName(authorName: string, text?: string): string {
  const trimmedText = text?.replace(CUSTOM_EMOJI_REGEX, '').replace(/\s+/g, ' ').trim();

  const base = trimmedText ? `${authorName} - ${trimmedText}` : authorName;
  const oneLine = base.replace(CUSTOM_EMOJI_REGEX, '').replace(/\s+/g, ' ').trim();

  if (oneLine.length <= THREAD_NAME_MAX) return oneLine;
  return oneLine.slice(0, THREAD_NAME_MAX - 3) + '...';
}
