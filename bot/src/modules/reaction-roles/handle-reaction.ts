import {
  Events,
  type Client,
  type MessageReaction,
  type PartialMessageReaction,
  type User,
} from "discord.js";
import { isModuleEnabled } from "../../../../shared/core/texts.js";
import { isOnCooldown, touchCooldown } from "./cooldown.js";
import { matchOptionByReaction } from "../../lib/modules/reaction-roles/panel.js";
import {
  tryAssignRole,
  tryRemoveRole,
} from "../../lib/core/discordRoles.js";
import {
  findPanelByMessageId,
  NAMESPACE,
} from "../../lib/modules/reaction-roles/config-io.js";

async function handleReaction(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | { id: string; bot?: boolean },
  added: boolean,
): Promise<void> {
  if (user.bot) return;
  if (!isModuleEnabled(NAMESPACE)) return;

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

  const panel = findPanelByMessageId(message.id);
  if (!panel || panel.reactionType !== "emoji") return;

  if (message.channelId !== panel.channelId) return;

  const emojiName = reaction.emoji.name;
  const emojiId = reaction.emoji.id;
  const option = matchOptionByReaction(panel.roleOptions, emojiName, emojiId);
  if (!option || !option.roleId.trim()) return;

  if (isOnCooldown(user.id, panel.id)) return;
  touchCooldown(user.id, panel.id);

  let member;
  try {
    member = await message.guild.members.fetch(user.id);
  } catch {
    return;
  }

  const hasRole = member.roles.cache.has(option.roleId);

  if (added) {
    if (hasRole) return;
    const result = await tryAssignRole(member, option.roleId);
    if (!result.ok) {
      console.warn(
        `[reaction-roles] Emoji add failed panel=${panel.id} user=${user.id} role=${option.roleId}`,
      );
      try {
        await reaction.users.remove(user.id);
      } catch {
        // best effort — reaction may already be gone
      }
    }
    return;
  }

  // Unreact
  if (!panel.toggleable) return;
  if (!hasRole) return;
  const result = await tryRemoveRole(member, option.roleId);
  if (!result.ok) {
    console.warn(
      `[reaction-roles] Emoji remove failed panel=${panel.id} user=${user.id} role=${option.roleId}`,
    );
  }
}

export function registerReactionHandlers(client: Client): void {
  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
      await handleReaction(reaction, user, true);
    } catch (err) {
      console.error("[reaction-roles] MessageReactionAdd error:", err);
    }
  });

  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    try {
      await handleReaction(reaction, user, false);
    } catch (err) {
      console.error("[reaction-roles] MessageReactionRemove error:", err);
    }
  });
}
