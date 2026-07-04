import {
  PermissionFlagsBits,
  DiscordAPIError,
  type Guild,
  type GuildMember,
  type Role,
} from 'discord.js';

export interface RoleChangeResult {
  ok: boolean;
  reason?: 'managed' | 'hierarchy' | 'permission' | 'missing';
}

function canManageRole(guild: Guild, role: Role): RoleChangeResult {
  const me = guild.members.me;
  if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return { ok: false, reason: 'permission' };
  }
  if (role.managed) return { ok: false, reason: 'managed' };
  if (role.id === guild.id) return { ok: false, reason: 'missing' };
  if (me.roles.highest.position <= role.position) {
    return { ok: false, reason: 'hierarchy' };
  }
  return { ok: true };
}

function mapRoleApiError(err: unknown): RoleChangeResult {
  if (err instanceof DiscordAPIError) {
    if (err.code === 50013) return { ok: false, reason: 'permission' };
    if (err.code === 50001 || err.code === 10011) return { ok: false, reason: 'missing' };
  }
  return { ok: false, reason: 'hierarchy' };
}

export async function tryAssignRole(
  member: GuildMember,
  roleId: string,
  logPrefix = '[roles]'
): Promise<RoleChangeResult> {
  const role = member.guild.roles.cache.get(roleId);
  if (!role) return { ok: false, reason: 'missing' };

  const check = canManageRole(member.guild, role);
  if (!check.ok) return check;

  if (member.roles.cache.has(roleId)) return { ok: true };

  try {
    await member.roles.add(roleId);
    return { ok: true };
  } catch (err) {
    console.error(`${logPrefix} Failed to assign role ${roleId} to ${member.id}:`, err);
    return mapRoleApiError(err);
  }
}

export async function tryRemoveRole(
  member: GuildMember,
  roleId: string,
  logPrefix = '[roles]'
): Promise<RoleChangeResult> {
  const role = member.guild.roles.cache.get(roleId);
  if (!role) return { ok: false, reason: 'missing' };

  const check = canManageRole(member.guild, role);
  if (!check.ok) return check;

  if (!member.roles.cache.has(roleId)) return { ok: true };

  try {
    await member.roles.remove(roleId);
    return { ok: true };
  } catch (err) {
    console.error(`${logPrefix} Failed to remove role ${roleId} from ${member.id}:`, err);
    return mapRoleApiError(err);
  }
}
