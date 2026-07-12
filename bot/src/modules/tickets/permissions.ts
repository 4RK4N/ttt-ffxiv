import { PermissionFlagsBits, type GuildMember } from "discord.js";

/** Configured staff role or guild Administrator. */
export function canStaffOrAdmin(
  member: GuildMember,
  staffRoleId: string,
): boolean {
  if (member.roles.cache.has(staffRoleId)) return true;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}
