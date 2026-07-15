import { canConfiguredRoleOrAdmin } from "../../lib/core/discordInteractions.js";
export function canCloseTicket(interaction, openerUserId, staffRoleId) {
    if (openerUserId && interaction.user.id === openerUserId)
        return true;
    const member = interaction.member;
    if (!member)
        return false;
    return canConfiguredRoleOrAdmin(member, staffRoleId);
}
export function canDeleteTicket(interaction, staffRoleId) {
    const member = interaction.member;
    if (!member)
        return false;
    return canConfiguredRoleOrAdmin(member, staffRoleId);
}
//# sourceMappingURL=permissions.js.map