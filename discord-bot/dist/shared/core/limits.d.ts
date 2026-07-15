/** Discord plain message content limit. */
export declare const DISCORD_MESSAGE_CONTENT_MAX = 2000;
/** Resolves configured max string length for editor fields; defaults to plain message limit. */
export declare function resolveFieldMaxLength(configured?: number): number;
/** Discord API error when a user's DMs are closed to the bot. */
export declare const DISCORD_CANNOT_SEND_DM = 50007;
/** Max role/button/select options per reaction-roles panel (Discord select menu cap). */
export declare const MAX_PANEL_OPTIONS = 25;
/** Discord custom emoji max file size (static and animated). */
export declare const DISCORD_EMOJI_MAX_BYTES: number;
/** Discord default per-file upload limit (base / boost level 1). */
export declare const DISCORD_DEFAULT_UPLOAD_BYTES: number;
/**
 * Per-file upload limit a bot can post in a guild, from its boost level.
 * @param premiumTier GuildPremiumTier (None=0, Tier1=1, Tier2=2, Tier3=3).
 */
export declare function guildUploadLimitBytes(premiumTier?: number): number;
/** Discord API error code (HTTP 413) when an upload exceeds the size limit. */
export declare const DISCORD_REQUEST_ENTITY_TOO_LARGE = 40005;
/** Builds a Discord channel URL for the current guild. */
export declare function channelUrl(guildId: string, channelId: string): string;
/** Builds a Discord channel/thread URL for the current guild. */
export declare function channelThreadUrl(guildId: string, threadId: string): string;
//# sourceMappingURL=limits.d.ts.map