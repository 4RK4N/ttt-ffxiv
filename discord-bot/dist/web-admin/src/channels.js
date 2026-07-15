import { fetchGuildChannelsRaw } from "./discordCache.js";
// Channel types we offer in the channel pickers: where text can be posted.
// 0 = GuildText, 5 = GuildAnnouncement, 15 = GuildForum.
const TEXT_CHANNEL_TYPES = new Set([0, 5, 15]);
/**
 * Lists the guild's text-capable channels via the bot token, sorted by position.
 * Results are cached for a short window. Throws on API failure so the caller can
 * surface an error to the editor.
 */
export async function listGuildChannels(cfg) {
    const raw = await fetchGuildChannelsRaw(cfg);
    return raw
        .filter((c) => typeof c.id === "string" &&
        typeof c.name === "string" &&
        typeof c.type === "number" &&
        TEXT_CHANNEL_TYPES.has(c.type))
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((c) => ({ id: c.id, name: c.name, type: c.type }));
}
//# sourceMappingURL=channels.js.map