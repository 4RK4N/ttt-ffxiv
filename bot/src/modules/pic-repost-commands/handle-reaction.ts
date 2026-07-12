import {
  Events,
  type Client,
  type MessageReaction,
  type PartialMessageReaction,
  type User,
} from "discord.js";
import { ensureFullReaction } from "../../lib/core/reactionContext.js";
import { reactionsMatch } from "../../../../shared/core/discordEmoji.js";
import { isModuleEnabled } from "../../../../shared/core/texts.js";
import {
  config,
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
  if (user.bot) return;
  if (!isModuleEnabled(NAMESPACE)) return;
  if (!botUserId) return;

  const ctx = await ensureFullReaction(reaction);
  if (!ctx) return;

  const { message } = ctx;
  const messageFetched = !reaction.message.partial;

  const cfg = config();
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
      await reaction.users.remove(user.id);
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
