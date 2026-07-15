import { isModuleEnabled } from "#shared/core/texts.js";
/**
 * Fetches partial reaction/message data and ensures a guild context.
 * Returns null when fetch fails or the message is not in a guild.
 */
export async function ensureFullReaction(reaction) {
    let fullReaction = reaction;
    if (reaction.partial) {
        try {
            fullReaction = await reaction.fetch();
        }
        catch {
            return null;
        }
    }
    let message = fullReaction.message;
    if (message.partial) {
        try {
            message = await message.fetch();
        }
        catch {
            return null;
        }
    }
    if (!message.guild)
        return null;
    return {
        reaction: fullReaction,
        message,
        guild: message.guild,
    };
}
/** Skips bot reactions and disabled modules before resolving reaction context. */
export async function guardReactionEvent(reaction, user, namespace) {
    if (user.bot)
        return null;
    if (!isModuleEnabled(namespace))
        return null;
    return ensureFullReaction(reaction);
}
//# sourceMappingURL=reactionContext.js.map