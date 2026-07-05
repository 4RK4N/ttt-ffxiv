import {
  Events,
  type APIGuildMember,
  type Client,
  type GuildMember,
} from "discord.js";
import { config } from "../../../../shared/config.js";
import {
  removeMemberDisplayName,
  setMemberDisplayName,
} from "../../lib/core/memberDisplayNames.js";
import { warmGuildMemberCache } from "./thread-members.js";

export interface CachedMember {
  roleIds: string[];
  isBot: boolean;
  displayName: string;
}

/** guildId → userId → member snapshot for ticket staff resolution. */
const guildMembers = new Map<string, Map<string, CachedMember>>();

function guildMap(guildId: string): Map<string, CachedMember> {
  let map = guildMembers.get(guildId);
  if (!map) {
    map = new Map();
    guildMembers.set(guildId, map);
  }
  return map;
}

function displayNameFromApi(data: APIGuildMember): string {
  const user = data.user;
  if (!user) return "Unknown";
  return data.nick ?? user.global_name ?? user.username;
}

export function upsertApiMember(guildId: string, data: APIGuildMember): void {
  const userId = data.user?.id;
  if (!userId) return;
  const displayName = displayNameFromApi(data);
  guildMap(guildId).set(userId, {
    roleIds: data.roles ?? [],
    isBot: data.user.bot ?? false,
    displayName,
  });
  setMemberDisplayName(guildId, userId, displayName);
}

export function upsertGuildMember(member: GuildMember): void {
  guildMap(member.guild.id).set(member.id, {
    roleIds: [...member.roles.cache.keys()],
    isBot: member.user.bot,
    displayName: member.displayName,
  });
  setMemberDisplayName(member.guild.id, member.id, member.displayName);
}

export function removeMember(guildId: string, userId: string): void {
  guildMembers.get(guildId)?.delete(userId);
  removeMemberDisplayName(guildId, userId);
}

export function getMembersForGuild(guildId: string): Map<string, CachedMember> {
  return guildMembers.get(guildId) ?? new Map();
}

function registerGatewayListeners(client: Client): void {
  client.on(Events.GuildMemberAdd, (member) => upsertGuildMember(member));
  client.on(Events.GuildMemberUpdate, (_old, member) =>
    upsertGuildMember(member),
  );
  client.on(Events.GuildMemberRemove, (member) =>
    removeMember(member.guild.id, member.id),
  );
}

async function warmTicketGuildCaches(client: Client): Promise<void> {
  const guildIds = config.guildId
    ? [config.guildId]
    : [...client.guilds.cache.keys()];

  for (const guildId of guildIds) {
    const guild =
      client.guilds.cache.get(guildId) ??
      (await client.guilds.fetch(guildId).catch(() => null));
    if (!guild) {
      console.warn(
        `[tickets] Guild ${guildId} not found; skipping member cache warm.`,
      );
      continue;
    }
    await warmGuildMemberCache(guild);
  }
}

export function registerMemberCacheWarm(client: Client): void {
  registerGatewayListeners(client);

  client.once(Events.ClientReady, (readyClient) => {
    void warmTicketGuildCaches(readyClient).catch((err) => {
      console.error("[tickets] Member cache warm on startup failed:", err);
    });
  });
}
