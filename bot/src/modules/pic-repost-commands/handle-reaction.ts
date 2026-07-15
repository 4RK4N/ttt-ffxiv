import {
  Events,
  type Client,
  type MessageReaction,
  type PartialMessageReaction,
  type User,
} from "discord.js";
import { guardReactionEvent } from "../../lib/core/reactionContext.js";
import { isDiscordUnknownMessage } from "../../lib/core/discordInteractions.js";
import { registerSafeHandler } from "../../lib/core/discordEvents.js";
import { reactionsMatch } from "@shared/core/discordEmoji.js";
import {
  data,
  NAMESPACE,
  resolveDeleteAuthorLastMention,
  resolveDeleteEmoji,
} from "../../lib/modules/pic-repost-commands/config-io.js";

import { deleteCommentsThreadForMessage } from "../../lib/core/threads.js";
import { resolvePicRepostAuthor } from "../../lib/modules/pic-repost-commands/resolve-author.js";

async function handleDeleteReaction(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | { id: string; bot?: boolean },
  botUserId: string | undefined,
): Promise<void> {
  if (!botUserId) return;

  const ctx = await guardReactionEvent(reaction, user, NAMESPACE);
  if (!ctx) return;

  const { message, reaction: fullReaction } = ctx;
  const messageFetched = !fullReaction.message.partial;

  const cfg = data();
  if (
    !reactionsMatch(
      resolveDeleteEmoji(cfg),
      reaction.emoji.name,
      reaction.emoji.id ?? null,
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
    try {
      // Event reaction already matched deleteEmoji; remove only that emoji for this user.
      await fullReaction.users.remove(user.id);
    } catch (err) {
      console.warn(
        `[${NAMESPACE}] Failed to remove non-author delete reaction message=${message.id} user=${user.id}:`,
        err,
      );
    }
    return;
  }

  try {
    await deleteCommentsThreadForMessage(message, `[${NAMESPACE}]`, {
      skipMessageRefetch: messageFetched,
    });
    await message.delete();
  } catch (err) {
    if (isDiscordUnknownMessage(err)) return;
    console.error(
      `[${NAMESPACE}] Failed to delete post message=${message.id}:`,
      err,
    );
  }
}

export function registerDeleteReactionHandler(client: Client): void {
  registerSafeHandler(
    client,
    Events.MessageReactionAdd,
    (reaction, user) => handleDeleteReaction(reaction, user, client.user?.id),
    `[${NAMESPACE}]`,
  );
}
