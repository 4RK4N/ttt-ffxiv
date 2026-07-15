import type { Client, Guild, Message, PartialMessage, ThreadChannel } from "discord.js";
export declare const THREAD_NAME_MAX = 100;
export declare const DEFAULT_THREAD_FIRST_MESSAGE: string;
export declare const THREAD_AUTO_ARCHIVE_MINUTES = 10080;
export declare const USER_MENTION_REGEX: RegExp;
/** Returns the first user mention ID in message content, if any. */
export declare function extractFirstMentionId(content: string): string | null;
/** Strips custom Discord emoji markup and collapses whitespace. */
export declare function stripCustomEmoji(text: string): string;
/** Optional context for resolving @mentions when building a thread title caption. */
export interface ThreadCaptionContext {
    guild: Guild | null;
    client: Client;
    message?: Message;
}
/**
 * Sanitizes free-form caption text for thread titles: resolves @mentions to
 * server display names, strips custom emoji, and collapses whitespace.
 */
export declare function prepareThreadCaptionText(content: string, ctx?: ThreadCaptionContext): string;
/**
 * Derives a thread name in the form "name - text": sanitizes the caption via
 * {@link prepareThreadCaptionText}, strips custom emoji from the author name,
 * collapses whitespace to a single line, and truncates to Discord's limit,
 * appending "..." when truncated.
 *
 * When `text` is blank (e.g. a link- or attachment-only post), the name is used
 * on its own with no trailing " - ".
 */
export declare function buildThreadName(authorName: string, text?: string, ctx?: ThreadCaptionContext): string;
export interface CommentsThreadOptions {
    name: string;
    logPrefix: string;
    authorUserId: string;
    firstMessage: string;
}
/** Adds the author and posts the opener in an already-created thread. */
export declare function populateCommentsThread(thread: ThreadChannel, options: Pick<CommentsThreadOptions, "logPrefix" | "authorUserId" | "firstMessage">): Promise<void>;
/**
 * Creates a comments thread on a channel message, adds the author, and sends the opener.
 * Returns false when thread creation fails (add/send failures are non-fatal).
 */
export declare function startAndPopulateCommentsThread(message: Message, options: CommentsThreadOptions): Promise<boolean>;
/** True when userId is a member of the thread (cache-first, then fetch). */
export declare function isThreadMember(thread: ThreadChannel, userId: string): Promise<boolean>;
/** Deletes the comments thread started from a channel message, if one exists. */
export declare function deleteCommentsThreadForMessage(message: Message | PartialMessage, logPrefix: string, options?: {
    skipMessageRefetch?: boolean;
}): Promise<void>;
//# sourceMappingURL=threads.d.ts.map