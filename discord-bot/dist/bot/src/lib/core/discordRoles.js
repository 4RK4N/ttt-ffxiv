import { PermissionFlagsBits, DiscordAPIError, } from "discord.js";
function canManageRole(guild, role) {
    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return { ok: false, reason: "permission" };
    }
    if (role.managed)
        return { ok: false, reason: "managed" };
    if (role.id === guild.id)
        return { ok: false, reason: "missing" };
    if (me.roles.highest.position <= role.position) {
        return { ok: false, reason: "hierarchy" };
    }
    return { ok: true };
}
function mapRoleApiError(err) {
    if (err instanceof DiscordAPIError) {
        if (err.code === 50013)
            return { ok: false, reason: "permission" };
        if (err.code === 50001 || err.code === 10011)
            return { ok: false, reason: "missing" };
    }
    return { ok: false, reason: "hierarchy" };
}
export async function tryAssignRole(member, roleId, logPrefix = "[roles]") {
    const role = member.guild.roles.cache.get(roleId);
    if (!role)
        return { ok: false, reason: "missing" };
    const check = canManageRole(member.guild, role);
    if (!check.ok)
        return check;
    if (member.roles.cache.has(roleId))
        return { ok: true };
    try {
        await member.roles.add(roleId);
        return { ok: true };
    }
    catch (err) {
        console.error(`${logPrefix} Failed to assign role ${roleId} to ${member.id}:`, err);
        return mapRoleApiError(err);
    }
}
export async function tryRemoveRole(member, roleId, logPrefix = "[roles]") {
    const role = member.guild.roles.cache.get(roleId);
    if (!role)
        return { ok: false, reason: "missing" };
    const check = canManageRole(member.guild, role);
    if (!check.ok)
        return check;
    if (!member.roles.cache.has(roleId))
        return { ok: true };
    try {
        await member.roles.remove(roleId);
        return { ok: true };
    }
    catch (err) {
        console.error(`${logPrefix} Failed to remove role ${roleId} from ${member.id}:`, err);
        return mapRoleApiError(err);
    }
}
/** User-facing message for a failed role assign/remove. */
export function roleChangeErrorMessage(result, hierarchyError, error) {
    return result.reason === "hierarchy" ? hierarchyError : error;
}
//# sourceMappingURL=discordRoles.js.map