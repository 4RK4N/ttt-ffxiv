import type { Client, Guild, Message, ThreadChannel } from "discord.js";
import { getMemberDisplayName } from "./memberDisplayNames.js";

const THREAD_NAME_MAX = 100; // Discord's hard limit for thread names.

// Default bilingual opener for comments threads. Each thread module keeps its own
// editable copy in its texts.json; this constant is the seed/fallback for them.
export const DEFAULT_THREAD_FIRST_MESSAGE =
  "Please comment here in the thread to not clutter the channel.\n\n" +
  "Bitte hier im Thread kommentieren um nicht den Channel zu überlasten.";

export const THREAD_AUTO_ARCHIVE_MINUTES = 10080; // 7 days

// Custom (server) emoji are sent as "<:name:id>" or "<a:name:id>". They render as
// literal text in thread names, so we strip them. Standard unicode emoji are kept.
const CUSTOM_EMOJI_REGEX = /<a?:\w+:\d+>/g;
const USER_MENTION_REGEX = /<@!?(\d+)>/g;

/** Strips custom Discord emoji markup and collapses whitespace. */
export function stripCustomEmoji(text: string): string {
  return text.replace(CUSTOM_EMOJI_REGEX, "").replace(/\s+/g, " ").trim();
}

/** Optional context for resolving @mentions when building a thread title caption. */
export interface ThreadCaptionContext {
  guild: Guild | null;
  client: Client;
  message?: Message;
}

function lookupDisplayName(
  ctx: ThreadCaptionContext,
  userId: string,
): string | undefined {
  const fromMention = ctx.message?.mentions.members?.get(userId);
  if (fromMention) return fromMention.displayName;

  const fromGuild = ctx.guild?.members.cache.get(userId);
  if (fromGuild) return fromGuild.displayName;

  if (ctx.guild?.id) {
    const fromCache = getMemberDisplayName(ctx.guild.id, userId);
    if (fromCache) return fromCache;
  }

  const user =
    ctx.message?.mentions.users.get(userId) ??
    ctx.client.users.cache.get(userId);
  if (user) return user.displayName ?? user.username;

  return undefined;
}

function resolveUserMentions(
  content: string,
  ctx: ThreadCaptionContext,
): string {
  return content.replace(USER_MENTION_REGEX, (match, userId: string) => {
    const name = lookupDisplayName(ctx, userId);
    return name ? `@${name}` : match;
  });
}

/**
 * Sanitizes free-form caption text for thread titles: resolves @mentions to
 * server display names, strips custom emoji, and collapses whitespace.
 */
export function prepareThreadCaptionText(
  content: string,
  ctx?: ThreadCaptionContext,
): string {
  const text = ctx ? resolveUserMentions(content, ctx) : content;
  return stripCustomEmoji(text);
}

/**
 * Derives a thread name in the form "name - text": sanitizes the caption via
 * {@link prepareThreadCaptionText}, strips custom emoji from the author name,
 * collapses whitespace to a single line, and truncates to Discord's limit,
 * appending "..." when truncated.
 *
 * When `text` is blank (e.g. a link- or attachment-only post), the name is used
 * on its own with no trailing " - ".
 */
export function buildThreadName(
  authorName: string,
  text?: string,
  ctx?: ThreadCaptionContext,
): string {
  const trimmedText = text ? prepareThreadCaptionText(text, ctx) : undefined;

  const base = trimmedText ? `${authorName} - ${trimmedText}` : authorName;
  const oneLine = stripCustomEmoji(base);

  if (oneLine.length <= THREAD_NAME_MAX) return oneLine;
  return oneLine.slice(0, THREAD_NAME_MAX - 3) + "...";
}

export interface CommentsThreadOptions {
  name: string;
  logPrefix: string;
  authorUserId: string;
  firstMessage: string;
}

/** Adds the author and posts the opener in an already-created thread. */
export async function populateCommentsThread(
  thread: ThreadChannel,
  options: Pick<
    CommentsThreadOptions,
    "logPrefix" | "authorUserId" | "firstMessage"
  >,
): Promise<void> {
  const { logPrefix, authorUserId, firstMessage } = options;

  try {
    await thread.members.add(authorUserId);
  } catch (err) {
    console.error(`${logPrefix} Failed to add author to comments thread:`, err);
  }

  await thread.send(firstMessage);
}

/**
 * Creates a comments thread on a channel message, adds the author, and sends the opener.
 * Returns false when thread creation fails (add/send failures are non-fatal).
 */
export async function startAndPopulateCommentsThread(
  message: Message,
  options: CommentsThreadOptions,
): Promise<boolean> {
  try {
    const thread = await message.startThread({
      name: options.name,
      autoArchiveDuration: THREAD_AUTO_ARCHIVE_MINUTES,
    });
    await populateCommentsThread(thread, options);
    return true;
  } catch (err) {
    console.error(
      `${options.logPrefix} Failed to create comments thread:`,
      err,
    );
    return false;
  }
}
