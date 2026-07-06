/** Discord plain message content limit. */
export const DISCORD_MESSAGE_CONTENT_MAX = 2000;

/** Max role/button/select options per reaction-roles panel (Discord select menu cap). */
export const MAX_PANEL_OPTIONS = 25;

/** Builds a Discord channel/thread URL for the current guild. */
export function channelThreadUrl(guildId: string, threadId: string): string {
  return `https://discord.com/channels/${guildId}/${threadId}`;
}
