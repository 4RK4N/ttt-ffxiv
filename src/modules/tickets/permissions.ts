import { PermissionFlagsBits, type GuildMember } from 'discord.js';

/** True when the member holds at least one of the given role IDs. */
export function memberHasAnyRole(member: GuildMember, roleIds: string[]): boolean {
  return roleIds.some((roleId) => member.roles.cache.has(roleId));
}

/** Configured staff roles or guild Administrator. */
export function canStaffOrAdmin(member: GuildMember, staffRoleIds: string[]): boolean {
  if (memberHasAnyRole(member, staffRoleIds)) return true;
  return member.permissions.has(PermissionFlagsBits.Administrator);
}
