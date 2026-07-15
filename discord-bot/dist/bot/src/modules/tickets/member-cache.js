import { Events, } from "discord.js";
import { config } from "#shared/config.js";
import { removeMemberDisplayName, setMemberDisplayName, } from "../../lib/core/memberDisplayNames.js";
import { registerSafeHandler } from "../../lib/core/discordEvents.js";
import { warmGuildMemberCache } from "./thread-members.js";
/** guildId → userId → member snapshot for ticket staff resolution. */
const guildMembers = new Map();
function guildMap(guildId) {
    let map = guildMembers.get(guildId);
    if (!map) {
        map = new Map();
        guildMembers.set(guildId, map);
    }
    return map;
}
function displayNameFromApi(data) {
    const user = data.user;
    if (!user)
        return "Unknown";
    return data.nick ?? user.global_name ?? user.username;
}
export function upsertApiMember(guildId, data) {
    const userId = data.user?.id;
    if (!userId)
        return;
    const displayName = displayNameFromApi(data);
    guildMap(guildId).set(userId, {
        roleIds: data.roles ?? [],
        isBot: data.user.bot ?? false,
        displayName,
    });
    setMemberDisplayName(guildId, userId, displayName);
}
export function upsertGuildMember(member) {
    guildMap(member.guild.id).set(member.id, {
        roleIds: [...member.roles.cache.keys()],
        isBot: member.user.bot,
        displayName: member.displayName,
    });
    setMemberDisplayName(member.guild.id, member.id, member.displayName);
}
export function removeMember(guildId, userId) {
    guildMembers.get(guildId)?.delete(userId);
    removeMemberDisplayName(guildId, userId);
}
export function getMembersForGuild(guildId) {
    return guildMembers.get(guildId) ?? new Map();
}
function registerGatewayListeners(client) {
    registerSafeHandler(client, Events.GuildMemberAdd, (member) => upsertGuildMember(member), "[tickets]");
    registerSafeHandler(client, Events.GuildMemberUpdate, (_old, member) => upsertGuildMember(member), "[tickets]");
    registerSafeHandler(client, Events.GuildMemberRemove, (member) => removeMember(member.guild.id, member.id), "[tickets]");
}
async function warmTicketGuildCaches(client) {
    const guildIds = config.guildId
        ? [config.guildId]
        : [...client.guilds.cache.keys()];
    for (const guildId of guildIds) {
        const guild = client.guilds.cache.get(guildId) ??
            (await client.guilds.fetch(guildId).catch(() => null));
        if (!guild) {
            console.warn(`[tickets] Guild ${guildId} not found; skipping member cache warm.`);
            continue;
        }
        await warmGuildMemberCache(guild);
    }
}
export function registerMemberCacheWarm(client) {
    registerGatewayListeners(client);
    client.once(Events.ClientReady, (readyClient) => {
        void warmTicketGuildCaches(readyClient).catch((err) => {
            console.error("[tickets] Member cache warm on startup failed:", err);
        });
    });
}
//# sourceMappingURL=member-cache.js.map