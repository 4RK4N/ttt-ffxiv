import { Events, type Client } from 'discord.js';
import { config } from '../../config.js';
import { warmGuildMemberCache } from './thread-members.js';

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
  client.once(Events.ClientReady, (readyClient) => {
    void warmTicketGuildCaches(readyClient).catch((err) => {
      console.error('[tickets] Member cache warm on startup failed:', err);
    });
  });
}
