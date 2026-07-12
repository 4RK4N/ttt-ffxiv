import { type ButtonInteraction, type GuildMember } from "discord.js";
import { canConfiguredRoleOrAdmin } from "../../lib/core/discordInteractions.js";

/** Configured staff role or guild Administrator. */
export function canStaffOrAdmin(
  member: GuildMember,
  staffRoleId: string,
): boolean {
  return canConfiguredRoleOrAdmin(member, staffRoleId);
}

export function canCloseTicket(
  interaction: ButtonInteraction,
  openerUserId: string | null,
  staffRoleId: string,
): boolean {
  if (openerUserId && interaction.user.id === openerUserId) return true;

  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return canStaffOrAdmin(member, staffRoleId);
}

export function canDeleteTicket(
  interaction: ButtonInteraction,
  staffRoleId: string,
): boolean {
  const member = interaction.member as GuildMember | null;
  if (!member) return false;
  return canStaffOrAdmin(member, staffRoleId);
}
