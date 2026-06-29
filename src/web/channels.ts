import type { WebConfig } from './config.js';
import { DISCORD_API } from './discord.js';

// Channel types we offer in the channel pickers: where text can be posted.
// 0 = GuildText, 5 = GuildAnnouncement, 15 = GuildForum.
const TEXT_CHANNEL_TYPES = new Set([0, 5, 15]);

export interface GuildChannel {
  id: string;
  name: string;
  type: number;
}

interface RawChannel {
  id?: string;
  name?: string;
  type?: number;
  position?: number;
}

// Channels change rarely; cache briefly so repeated UI loads don't hammer the API.
const CACHE_TTL_MS = 30_000;
let cache: { at: number; channels: GuildChannel[] } | null = null;

/**
 * Lists the guild's text-capable channels via the bot token, sorted by position.
 * Results are cached for a short window. Throws on API failure so the caller can
 * surface an error to the editor.
 */
export async function listGuildChannels(cfg: WebConfig): Promise<GuildChannel[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.channels;
  }

  const res = await fetch(`${DISCORD_API}/guilds/${cfg.guildId}/channels`, {
    headers: { Authorization: `Bot ${cfg.botToken}` },
  });

  if (!res.ok) {
    throw new Error(`Discord API returned HTTP ${res.status} when listing channels.`);
  }

  const raw = (await res.json()) as RawChannel[];
  const channels = raw
    .filter((c): c is Required<Pick<RawChannel, 'id' | 'name' | 'type'>> & RawChannel =>
      typeof c.id === 'string' &&
      typeof c.name === 'string' &&
      typeof c.type === 'number' &&
      TEXT_CHANNEL_TYPES.has(c.type)
    )
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((c) => ({ id: c.id, name: c.name, type: c.type }));

  cache = { at: Date.now(), channels };
  return channels;
}
