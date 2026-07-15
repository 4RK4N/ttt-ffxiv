/** Adds a single bot reaction to a message; retries on HTTP 429. */
export declare function addBotMessageReaction(botToken: string, channelId: string, messageId: string, emoji: string): Promise<void>;
/**
 * Adds bot reactions one at a time with spacing to avoid Discord rate limits.
 * Waits briefly before the first reaction when syncing after a message edit/create.
 */
export declare function syncBotMessageReactions(botToken: string, channelId: string, messageId: string, emojis: string[], options?: {
    delayMs?: number;
    afterMessageEdit?: boolean;
}): Promise<void>;
//# sourceMappingURL=discordReactions.d.ts.map