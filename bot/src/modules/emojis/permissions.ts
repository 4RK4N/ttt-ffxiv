import { canConfiguredRoleOrAdmin } from "../../lib/core/discordInteractions.js";
import type { GuildMember } from "discord.js";

/** Configured emoji manager role or guild Administrator. */
export function canEmojiOrAdmin(
  member: GuildMember,
  emojiRoleId: string | undefined,
): boolean {
  return canConfiguredRoleOrAdmin(member, emojiRoleId);
}
