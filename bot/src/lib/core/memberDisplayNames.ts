import { GuildMember, type User } from "discord.js";

/** guildId → userId → display name (populated by gateway listeners / cache warm). */
const displayNames = new Map<string, Map<string, string>>();

function guildMap(guildId: string): Map<string, string> {
  let map = displayNames.get(guildId);
  if (!map) {
    map = new Map();
    displayNames.set(guildId, map);
  }
  return map;
}

export function setMemberDisplayName(
  guildId: string,
  userId: string,
  displayName: string,
): void {
  guildMap(guildId).set(userId, displayName);
}

export function getMemberDisplayName(
  guildId: string,
  userId: string,
): string | undefined {
  return displayNames.get(guildId)?.get(userId);
}

export function removeMemberDisplayName(guildId: string, userId: string): void {
  displayNames.get(guildId)?.delete(userId);
}

/** Resolves a guild member's display name, falling back to user display name or username. */
export function resolveDisplayName(
  member: GuildMember | null | undefined,
  user: Pick<User, "displayName" | "username">,
): string {
  if (member instanceof GuildMember) return member.displayName;
  return user.displayName ?? user.username;
}
