/** Discord plain message content limit. */
export const DISCORD_MESSAGE_CONTENT_MAX = 2000;

/** Resolves configured max string length for editor fields; defaults to plain message limit. */
export function resolveFieldMaxLength(configured?: number): number {
  return configured ?? DISCORD_MESSAGE_CONTENT_MAX;
}

/** Discord API error when a user's DMs are closed to the bot. */
export const DISCORD_CANNOT_SEND_DM = 50007;

/** Max role/button/select options per reaction-roles panel (Discord select menu cap). */
export const MAX_PANEL_OPTIONS = 25;

/** Discord custom emoji max file size (static and animated). */
export const DISCORD_EMOJI_MAX_BYTES = 256 * 1024;

/** Discord default per-file upload limit (base / boost level 1). */
export const DISCORD_DEFAULT_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Per-file upload limit a bot can post in a guild, from its boost level.
 * @param premiumTier GuildPremiumTier (None=0, Tier1=1, Tier2=2, Tier3=3).
 */
export function guildUploadLimitBytes(premiumTier?: number): number {
  if (premiumTier === 3) return 100 * 1024 * 1024;
  if (premiumTier === 2) return 50 * 1024 * 1024;
  return DISCORD_DEFAULT_UPLOAD_BYTES;
}

/** Discord API error code (HTTP 413) when an upload exceeds the size limit. */
export const DISCORD_REQUEST_ENTITY_TOO_LARGE = 40005;

/** Builds a Discord channel URL for the current guild. */
export function channelUrl(guildId: string, channelId: string): string {
  return `https://discord.com/channels/${guildId}/${channelId}`;
}

/** Builds a Discord channel/thread URL for the current guild. */
export function channelThreadUrl(guildId: string, threadId: string): string {
  return channelUrl(guildId, threadId);
}
