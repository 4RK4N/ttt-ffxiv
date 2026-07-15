import { replyEphemeral } from "../../lib/core/discordInteractions.js";
/**
 * Shared confirm-step flow for ticket close/delete: permission check, optional
 * confirm prompt, and TOCTOU re-check before the caller runs the action.
 */
export async function runTicketConfirmFlow(options) {
    const { interaction, isConfirm, confirmPrefix, actionPayload, cancelCustomId, labels, buildConfirmRow, canPerform, deniedMessage, } = options;
    if (!canPerform()) {
        await replyEphemeral(interaction, deniedMessage);
        return "denied";
    }
    if (!isConfirm) {
        const row = buildConfirmRow(`${confirmPrefix}${actionPayload}`, cancelCustomId, labels.yesLabel, labels.noLabel);
        await replyEphemeral(interaction, {
            content: labels.prompt,
            components: [row],
        });
        return "prompted";
    }
    if (!canPerform()) {
        await replyEphemeral(interaction, deniedMessage);
        return "denied";
    }
    return "confirmed";
}
//# sourceMappingURL=confirm-flow.js.map