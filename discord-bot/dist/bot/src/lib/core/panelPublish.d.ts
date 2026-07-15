export interface DiscordApiContext {
    botToken: string;
}
export interface DiscordMessagePayload {
    embeds?: unknown[];
    components?: unknown[];
    content?: string;
}
/**
 * Posts or edits a Discord channel message. Tries PATCH when existingMessageId
 * is set; falls back to POST on 404. Optional afterPublish runs after a
 * successful edit or create (e.g. sync emoji reactions).
 */
export declare function publishDiscordMessage(ctx: DiscordApiContext, channelId: string, payload: DiscordMessagePayload, existingMessageId?: string, afterPublish?: (messageId: string) => Promise<void>): Promise<string>;
//# sourceMappingURL=panelPublish.d.ts.map