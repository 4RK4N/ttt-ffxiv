import { GuildMember } from "discord.js";
/** guildId → userId → display name (populated by gateway listeners / cache warm). */
const displayNames = new Map();
function guildMap(guildId) {
    let map = displayNames.get(guildId);
    if (!map) {
        map = new Map();
        displayNames.set(guildId, map);
    }
    return map;
}
export function setMemberDisplayName(guildId, userId, displayName) {
    guildMap(guildId).set(userId, displayName);
}
export function getMemberDisplayName(guildId, userId) {
    return displayNames.get(guildId)?.get(userId);
}
export function removeMemberDisplayName(guildId, userId) {
    displayNames.get(guildId)?.delete(userId);
}
/** Resolves a guild member's display name, falling back to user display name or username. */
export function resolveDisplayName(member, user) {
    if (member instanceof GuildMember)
        return member.displayName;
    return user.displayName ?? user.username;
}
//# sourceMappingURL=memberDisplayNames.js.map