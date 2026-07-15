import type { WebConfig } from "./config.js";
import { discordBotFetch } from "@shared/core/discordApi.js";

/** Guild list endpoints change rarely; cache briefly to cut burst API calls. */
export const DISCORD_LIST_CACHE_TTL_MS = 30_000;

interface CacheEntry<T> {
  at: number;
  value: T;
}

function readCache<T>(
  entry: CacheEntry<T> | null,
  ttlMs: number,
): T | undefined {
  if (entry && Date.now() - entry.at < ttlMs) return entry.value;
  return undefined;
}

function writeCache<T>(
  entryRef: { current: CacheEntry<T> | null },
  value: T,
): void {
  entryRef.current = { at: Date.now(), value };
}

const guildOwnerCache: { current: CacheEntry<string | null> | null } = {
  current: null,
};
const guildRolesCache: { current: CacheEntry<RawGuildRole[]> | null } = {
  current: null,
};
const guildChannelsCache: { current: CacheEntry<RawGuildChannel[]> | null } = {
  current: null,
};

/** GET with bot token; returns null on 404. */
export async function discordBotGetOptional<T>(
  cfg: WebConfig,
  path: string,
): Promise<T | null> {
  const res = await discordBotFetch(cfg.botToken, path);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Discord API returned HTTP ${res.status} for ${path}.`);
  }
  return (await res.json()) as T;
}

async function discordBotGetJson<T>(cfg: WebConfig, path: string): Promise<T> {
  const res = await discordBotFetch(cfg.botToken, path);
  if (!res.ok) {
    throw new Error(`Discord API returned HTTP ${res.status} for ${path}.`);
  }
  return (await res.json()) as T;
}

export interface RawGuildRole {
  id?: string;
  name?: string;
  color?: number;
  position?: number;
  managed?: boolean;
  permissions?: string | number;
}

export interface RawGuildChannel {
  id?: string;
  name?: string;
  type?: number;
  position?: number;
}

/** Cached guild owner id (null when the guild is missing or has no owner_id). */
export async function fetchGuildOwnerId(
  cfg: WebConfig,
): Promise<string | null> {
  const cached = readCache(guildOwnerCache.current, DISCORD_LIST_CACHE_TTL_MS);
  if (cached !== undefined) return cached;

  const guild = await discordBotGetOptional<{ owner_id?: string }>(
    cfg,
    `/guilds/${cfg.guildId}`,
  );
  const ownerId = guild?.owner_id ?? null;
  writeCache(guildOwnerCache, ownerId);
  return ownerId;
}

/** Cached full guild role list (includes permissions for admin checks). */
export async function fetchGuildRolesRaw(
  cfg: WebConfig,
): Promise<RawGuildRole[]> {
  const cached = readCache(guildRolesCache.current, DISCORD_LIST_CACHE_TTL_MS);
  if (cached) return cached;

  const roles = await discordBotGetJson<RawGuildRole[]>(
    cfg,
    `/guilds/${cfg.guildId}/roles`,
  );
  if (!Array.isArray(roles)) {
    throw new Error("Discord API returned an invalid roles list.");
  }
  writeCache(guildRolesCache, roles);
  return roles;
}

/** Cached full guild channel list. */
export async function fetchGuildChannelsRaw(
  cfg: WebConfig,
): Promise<RawGuildChannel[]> {
  const cached = readCache(
    guildChannelsCache.current,
    DISCORD_LIST_CACHE_TTL_MS,
  );
  if (cached) return cached;

  const channels = await discordBotGetJson<RawGuildChannel[]>(
    cfg,
    `/guilds/${cfg.guildId}/channels`,
  );
  if (!Array.isArray(channels)) {
    throw new Error("Discord API returned an invalid channel list.");
  }
  writeCache(guildChannelsCache, channels);
  return channels;
}
