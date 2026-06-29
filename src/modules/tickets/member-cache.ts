import {
  Events,
  type APIGuildMember,
  type Client,
  type GuildMember,
} from 'discord.js';
import { config } from '../../config.js';
import { warmGuildMemberCache } from './thread-members.js';

export interface CachedMember {
  roleIds: string[];
  isBot: boolean;
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

export function upsertApiMember(guildId: string, data: APIGuildMember): void {
  const userId = data.user?.id;
  if (!userId) return;
  guildMap(guildId).set(userId, {
    roleIds: data.roles ?? [],
    isBot: data.user.bot ?? false,
  });
}

export function upsertGuildMember(member: GuildMember): void {
  guildMap(member.guild.id).set(member.id, {
    roleIds: [...member.roles.cache.keys()],
    isBot: member.user.bot,
  });
}

export function removeMember(guildId: string, userId: string): void {
  guildMembers.get(guildId)?.delete(userId);
}

export function getMembersForGuild(guildId: string): Map<string, CachedMember> {
  return guildMembers.get(guildId) ?? new Map();
}

function registerGatewayListeners(client: Client): void {
  client.on(Events.GuildMemberAdd, (member) => upsertGuildMember(member));
  client.on(Events.GuildMemberUpdate, (_old, member) => upsertGuildMember(member));
  client.on(Events.GuildMemberRemove, (member) => removeMember(member.guild.id, member.id));
}

async function warmTicketGuildCaches(client: Client): Promise<void> {
  const guildIds = config.guildId ? [config.guildId] : [...client.guilds.cache.keys()];

  for (const guildId of guildIds) {
    const guild =
      client.guilds.cache.get(guildId) ??
      (await client.guilds.fetch(guildId).catch(() => null));
    if (!guild) {
      console.warn(`[tickets] Guild ${guildId} not found; skipping member cache warm.`);
      continue;
    }
    await warmGuildMemberCache(guild);
  }
}

export function registerMemberCacheWarm(client: Client): void {
  registerGatewayListeners(client);

  client.once(Events.ClientReady, (readyClient) => {
    void warmTicketGuildCaches(readyClient).catch((err) => {
      console.error('[tickets] Member cache warm on startup failed:', err);
    });
  });
}
