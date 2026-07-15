import type { WebConfig } from "./config.js";
/** Guild list endpoints change rarely; cache briefly to cut burst API calls. */
export declare const DISCORD_LIST_CACHE_TTL_MS = 30000;
/** GET with bot token; returns null on 404. */
export declare function discordBotGetOptional<T>(cfg: WebConfig, path: string): Promise<T | null>;
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
export declare function fetchGuildOwnerId(cfg: WebConfig): Promise<string | null>;
/** Cached full guild role list (includes permissions for admin checks). */
export declare function fetchGuildRolesRaw(cfg: WebConfig): Promise<RawGuildRole[]>;
/** Cached full guild channel list. */
export declare function fetchGuildChannelsRaw(cfg: WebConfig): Promise<RawGuildChannel[]>;
//# sourceMappingURL=discordCache.d.ts.map