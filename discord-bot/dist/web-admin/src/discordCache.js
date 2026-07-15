import { discordBotFetch } from "#shared/core/discordApi.js";
/** Guild list endpoints change rarely; cache briefly to cut burst API calls. */
export const DISCORD_LIST_CACHE_TTL_MS = 30_000;
function readCache(entry, ttlMs) {
    if (entry && Date.now() - entry.at < ttlMs)
        return entry.value;
    return undefined;
}
function writeCache(entryRef, value) {
    entryRef.current = { at: Date.now(), value };
}
const guildOwnerCache = {
    current: null,
};
const guildRolesCache = {
    current: null,
};
const guildChannelsCache = {
    current: null,
};
/** GET with bot token; returns null on 404. */
export async function discordBotGetOptional(cfg, path) {
    const res = await discordBotFetch(cfg.botToken, path);
    if (res.status === 404)
        return null;
    if (!res.ok) {
        throw new Error(`Discord API returned HTTP ${res.status} for ${path}.`);
    }
    return (await res.json());
}
async function discordBotGetJson(cfg, path) {
    const res = await discordBotFetch(cfg.botToken, path);
    if (!res.ok) {
        throw new Error(`Discord API returned HTTP ${res.status} for ${path}.`);
    }
    return (await res.json());
}
/** Cached guild owner id (null when the guild is missing or has no owner_id). */
export async function fetchGuildOwnerId(cfg) {
    const cached = readCache(guildOwnerCache.current, DISCORD_LIST_CACHE_TTL_MS);
    if (cached !== undefined)
        return cached;
    const guild = await discordBotGetOptional(cfg, `/guilds/${cfg.guildId}`);
    const ownerId = guild?.owner_id ?? null;
    writeCache(guildOwnerCache, ownerId);
    return ownerId;
}
/** Cached full guild role list (includes permissions for admin checks). */
export async function fetchGuildRolesRaw(cfg) {
    const cached = readCache(guildRolesCache.current, DISCORD_LIST_CACHE_TTL_MS);
    if (cached)
        return cached;
    const roles = await discordBotGetJson(cfg, `/guilds/${cfg.guildId}/roles`);
    if (!Array.isArray(roles)) {
        throw new Error("Discord API returned an invalid roles list.");
    }
    writeCache(guildRolesCache, roles);
    return roles;
}
/** Cached full guild channel list. */
export async function fetchGuildChannelsRaw(cfg) {
    const cached = readCache(guildChannelsCache.current, DISCORD_LIST_CACHE_TTL_MS);
    if (cached)
        return cached;
    const channels = await discordBotGetJson(cfg, `/guilds/${cfg.guildId}/channels`);
    if (!Array.isArray(channels)) {
        throw new Error("Discord API returned an invalid channel list.");
    }
    writeCache(guildChannelsCache, channels);
    return channels;
}
//# sourceMappingURL=discordCache.js.map