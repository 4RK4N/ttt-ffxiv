import { getMemberDisplayName } from "./memberDisplayNames.js";
export const THREAD_NAME_MAX = 100; // Discord's hard limit for thread names.
// Default bilingual opener for comments threads. Each thread module keeps its own
// Default thread opener; modules override via `threadFirstMessage` in the database.
export const DEFAULT_THREAD_FIRST_MESSAGE = "Please comment here in the thread to not clutter the channel.\n\n" +
    "Bitte hier im Thread kommentieren um nicht den Channel zu überlasten.";
export const THREAD_AUTO_ARCHIVE_MINUTES = 10080; // 7 days
// Custom (server) emoji are sent as "<:name:id>" or "<a:name:id>". They render as
// literal text in thread names, so we strip them. Standard unicode emoji are kept.
const CUSTOM_EMOJI_REGEX = /<a?:\w+:\d+>/g;
export const USER_MENTION_REGEX = /<@!?(\d{17,20})>/g;
const USER_MENTION_EXTRACT = /<@!?(\d{17,20})>/;
/** Returns the first user mention ID in message content, if any. */
export function extractFirstMentionId(content) {
    return USER_MENTION_EXTRACT.exec(content)?.[1] ?? null;
}
/** Strips custom Discord emoji markup and collapses whitespace. */
export function stripCustomEmoji(text) {
    return text.replace(CUSTOM_EMOJI_REGEX, "").replace(/\s+/g, " ").trim();
}
function lookupDisplayName(ctx, userId) {
    const fromMention = ctx.message?.mentions.members?.get(userId);
    if (fromMention)
        return fromMention.displayName;
    const fromGuild = ctx.guild?.members.cache.get(userId);
    if (fromGuild)
        return fromGuild.displayName;
    if (ctx.guild?.id) {
        const fromCache = getMemberDisplayName(ctx.guild.id, userId);
        if (fromCache)
            return fromCache;
    }
    const user = ctx.message?.mentions.users.get(userId) ??
        ctx.client.users.cache.get(userId);
    if (user)
        return user.displayName ?? user.username;
    return undefined;
}
function resolveUserMentions(content, ctx) {
    return content.replace(USER_MENTION_REGEX, (match, userId) => {
        const name = lookupDisplayName(ctx, userId);
        return name ? `@${name}` : match;
    });
}
/**
 * Sanitizes free-form caption text for thread titles: resolves @mentions to
 * server display names, strips custom emoji, and collapses whitespace.
 */
export function prepareThreadCaptionText(content, ctx) {
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
export function buildThreadName(authorName, text, ctx) {
    const trimmedText = text ? prepareThreadCaptionText(text, ctx) : undefined;
    const base = trimmedText ? `${authorName} - ${trimmedText}` : authorName;
    const oneLine = stripCustomEmoji(base);
    if (oneLine.length <= THREAD_NAME_MAX)
        return oneLine;
    return oneLine.slice(0, THREAD_NAME_MAX - 3) + "...";
}
/** Adds the author and posts the opener in an already-created thread. */
export async function populateCommentsThread(thread, options) {
    const { logPrefix, authorUserId, firstMessage } = options;
    try {
        await thread.members.add(authorUserId);
    }
    catch (err) {
        console.error(`${logPrefix} Failed to add author to comments thread:`, err);
    }
    await thread.send(firstMessage);
}
/**
 * Creates a comments thread on a channel message, adds the author, and sends the opener.
 * Returns false when thread creation fails (add/send failures are non-fatal).
 */
export async function startAndPopulateCommentsThread(message, options) {
    try {
        const thread = await message.startThread({
            name: options.name,
            autoArchiveDuration: THREAD_AUTO_ARCHIVE_MINUTES,
        });
        await populateCommentsThread(thread, options);
        return true;
    }
    catch (err) {
        console.error(`${options.logPrefix} Failed to create comments thread:`, err);
        return false;
    }
}
/** True when userId is a member of the thread (cache-first, then fetch). */
export async function isThreadMember(thread, userId) {
    if (thread.members.cache.has(userId))
        return true;
    try {
        const members = await thread.members.fetch();
        return members.has(userId);
    }
    catch {
        return false;
    }
}
/** Deletes the comments thread started from a channel message, if one exists. */
export async function deleteCommentsThreadForMessage(message, logPrefix, options) {
    if (!message.hasThread)
        return;
    let thread = message.thread;
    if (!thread && !options?.skipMessageRefetch) {
        try {
            const fresh = await message.fetch();
            thread = fresh.thread ?? null;
        }
        catch {
            return;
        }
    }
    if (!thread)
        return;
    try {
        await thread.delete();
    }
    catch (err) {
        const code = err.code;
        if (code === 10003)
            return;
        console.warn(`${logPrefix} Failed to delete comments thread thread=${thread.id}:`, err);
    }
}
//# sourceMappingURL=threads.js.map