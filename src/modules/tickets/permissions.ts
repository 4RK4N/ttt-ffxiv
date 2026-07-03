import { PermissionFlagsBits, type GuildMember } from 'discord.js';
import { memberHasAnyRole } from '../../core/discordInteractions.js';

export { memberHasAnyRole };

/** Configured staff roles or guild Administrator. */
export function canStaffOrAdmin(member: GuildMember, staffRoleIds: string[]): boolean {
  if (memberHasAnyRole(member, staffRoleIds)) return true;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}
