import { canConfiguredRoleOrAdmin, replyEphemeral, } from "../../lib/core/discordInteractions.js";
import { format } from "#shared/core/texts.js";
import { tryAssignRole, roleChangeErrorMessage, } from "../../lib/core/discordRoles.js";
import { finalizeTicketClose, resolveOpenerUserId } from "./finalize-close.js";
import { guardTicketThreadAction } from "./guards.js";
import { parseRoleActionCustomId } from "./parsers.js";
import { get } from "../../lib/modules/tickets/config-io.js";
export async function handleRoleAction(interaction) {
    const parsed = parseRoleActionCustomId(interaction.customId);
    if (!parsed) {
        await replyEphemeral(interaction, get("invalidInteraction"));
        return;
    }
    const guarded = await guardTicketThreadAction(interaction, parsed.typeId, parsed.threadId, { requireOpen: true });
    if (!guarded.ok)
        return;
    const { ticketType, thread, t } = guarded.ctx;
    if (!ticketType.roleActionRoleId) {
        await replyEphemeral(interaction, t.categoryUnpublished);
        return;
    }
    const member = interaction.member;
    if (!member || !canConfiguredRoleOrAdmin(member, ticketType.staffRoleId)) {
        await replyEphemeral(interaction, t.noPermission);
        return;
    }
    const { openerUserId, welcomeMessage } = await resolveOpenerUserId(thread, parsed.openerUserId);
    if (!openerUserId) {
        await replyEphemeral(interaction, t.roleActionOpenerMissing);
        return;
    }
    const guild = thread.guild;
    const openerMember = await guild.members
        .fetch(openerUserId)
        .catch(() => null);
    if (!openerMember) {
        await replyEphemeral(interaction, t.roleActionOpenerMissing);
        return;
    }
    const roleId = ticketType.roleActionRoleId;
    const role = guild.roles.cache.get(roleId);
    const result = await tryAssignRole(openerMember, roleId);
    if (!result.ok) {
        await replyEphemeral(interaction, roleChangeErrorMessage(result, t.roleActionHierarchyError, t.roleActionError));
        return;
    }
    await interaction.deferUpdate();
    try {
        const confirmation = format(ticketType.roleActionConfirmation, {
            mention: `<@${openerUserId}>`,
            role: role?.name ?? "role",
        });
        await finalizeTicketClose(thread, parsed.typeId, ticketType, confirmation, welcomeMessage, openerUserId);
    }
    catch (err) {
        console.error("[tickets] Failed to complete role action:", err);
        await replyEphemeral(interaction, t.closeError);
    }
}
//# sourceMappingURL=role-action.js.map