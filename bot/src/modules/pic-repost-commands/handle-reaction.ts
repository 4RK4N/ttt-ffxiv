import {
  Events,
  type Client,
  type MessageReaction,
  type PartialMessageReaction,
  type User,
} from "discord.js";
import {
  emojiMatchKey,
  reactionMatchKey,
} from "../../../../shared/core/discordEmoji.js";
import { isModuleEnabled } from "../../../../shared/core/texts.js";
import {
  config,
  NAMESPACE,
  resolveDeleteAuthorLastMention,
  resolveDeleteEmoji,
} from "../../lib/modules/pic-repost-commands/config-io.js";
import { resolvePicRepostAuthor } from "../../lib/modules/pic-repost-commands/resolve-author.js";

function matchesDeleteEmoji(
  emojiName: string | null,
  emojiId: string | null,
  deleteEmoji: string,
): boolean {
  const configKey = emojiMatchKey(deleteEmoji);
  const reactionKey = reactionMatchKey(emojiName, emojiId);
  return !!configKey && configKey === reactionKey;
}

function findDeleteEmojiReaction(
  message: MessageReaction["message"],
  deleteEmoji: string,
): MessageReaction | undefined {
  for (const cached of message.reactions.cache.values()) {
    if (
      matchesDeleteEmoji(
        cached.emoji.name,
        cached.emoji.id ?? null,
        deleteEmoji,
      )
    ) {
      return cached;
    }
  }
  return undefined;
}

async function handleDeleteReaction(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | { id: string; bot?: boolean },
  botUserId: string | undefined,
): Promise<void> {
  if (user.bot) return;
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!botUserId) return;

  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch {
      return;
    }
  }

  const message = reaction.message;
  if (message.partial) {
    try {
      await message.fetch();
    } catch {
      return;
    }
  }
  if (!message.guild) return;

  const cfg = config();
  if (
    !matchesDeleteEmoji(
      reaction.emoji.name,
      reaction.emoji.id ?? null,
      resolveDeleteEmoji(cfg),
    )
  ) {
    return;
  }

  const authorUserId = resolvePicRepostAuthor(
    message,
    botUserId,
    resolveDeleteAuthorLastMention(cfg),
  );
  if (!authorUserId) return;

  if (user.id !== authorUserId) {
    const deleteReaction = findDeleteEmojiReaction(
      message,
      resolveDeleteEmoji(cfg),
    );
    if (!deleteReaction) return;
    try {
      // Remove only this user's delete-emoji reaction; leave hearts etc. untouched.
      await deleteReaction.users.remove(user.id);
    } catch (err) {
      console.warn(
        `[${NAMESPACE}] Failed to remove non-author delete reaction message=${message.id} user=${user.id}:`,
        err,
      );
    }
    return;
  }

  try {
    await message.delete();
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 10008) return;
    console.error(
      `[${NAMESPACE}] Failed to delete post message=${message.id}:`,
      err,
    );
  }
}

export function registerDeleteReactionHandler(client: Client): void {
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
      await handleDeleteReaction(reaction, user, client.user?.id);
    } catch (err) {
      console.error(`[${NAMESPACE}] MessageReactionAdd error:`, err);
    }
  });
}
