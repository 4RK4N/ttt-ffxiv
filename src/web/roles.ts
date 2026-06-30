import type { WebConfig } from './config.js';
import { DISCORD_API } from './discord.js';

export interface GuildRole {
  id: string;
  name: string;
  color: number;
}

interface RawRole {
  id?: string;
  name?: string;
  color?: number;
  position?: number;
  managed?: boolean;
}

const CACHE_TTL_MS = 30_000;
let cache: { at: number; roles: GuildRole[] } | null = null;

export async function listGuildRoles(cfg: WebConfig): Promise<GuildRole[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.roles;
  }

  const res = await fetch(`${DISCORD_API}/guilds/${cfg.guildId}/roles`, {
    headers: { Authorization: `Bot ${cfg.botToken}` },
  });

  if (!res.ok) {
    throw new Error(`Discord API returned HTTP ${res.status} when listing roles.`);
  }

  const raw = (await res.json()) as RawRole[];
  const roles = raw
    .filter(
      (r): r is Required<Pick<RawRole, 'id' | 'name'>> & RawRole =>
        typeof r.id === 'string' &&
        typeof r.name === 'string' &&
        r.name !== '@everyone' &&
        r.managed !== true
    )
    .sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
    .map((r) => ({ id: r.id, name: r.name, color: r.color ?? 0 }));

  cache = { at: Date.now(), roles };
  return roles;
}
