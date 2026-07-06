import type {
  Guild,
  Message,
  MessageReaction,
  PartialMessageReaction,
} from "discord.js";

export interface FullReactionContext {
  reaction: MessageReaction;
  message: Message;
  guild: Guild;
}

/**
 * Fetches partial reaction/message data and ensures a guild context.
 * Returns null when fetch fails or the message is not in a guild.
 */
export async function ensureFullReaction(
  reaction: MessageReaction | PartialMessageReaction,
): Promise<FullReactionContext | null> {
  let fullReaction = reaction;
  if (reaction.partial) {
    try {
      fullReaction = await reaction.fetch();
    } catch {
      return null;
    }
  }

  let message = fullReaction.message;
  if (message.partial) {
    try {
      message = await message.fetch();
    } catch {
      return null;
    }
  }
  if (!message.guild) return null;

  return {
    reaction: fullReaction as MessageReaction,
    message,
    guild: message.guild,
  };
}
