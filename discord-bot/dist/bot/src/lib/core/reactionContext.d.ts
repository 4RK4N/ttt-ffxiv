import type { Guild, Message, MessageReaction, PartialMessageReaction } from "discord.js";
export interface FullReactionContext {
    reaction: MessageReaction;
    message: Message;
    guild: Guild;
}
/**
 * Fetches partial reaction/message data and ensures a guild context.
 * Returns null when fetch fails or the message is not in a guild.
 */
export declare function ensureFullReaction(reaction: MessageReaction | PartialMessageReaction): Promise<FullReactionContext | null>;
/** Skips bot reactions and disabled modules before resolving reaction context. */
export declare function guardReactionEvent(reaction: MessageReaction | PartialMessageReaction, user: {
    bot?: boolean;
}, namespace: string): Promise<FullReactionContext | null>;
//# sourceMappingURL=reactionContext.d.ts.map