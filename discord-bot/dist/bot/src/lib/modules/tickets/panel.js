import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { buildEmbed } from "../../core/embedBuilder.js";
import { applyEmojiToButton } from "../../core/buttonEmoji.js";
import { publishDiscordMessage, } from "../../core/panelPublish.js";
import { validateTicketType } from "#shared/modules/tickets/validate.js";
import { resolveTicketType } from "./config-io.js";
export const CLOSE_CANCEL_PREFIX = "tickets:close-cancel:";
export const DELETE_CANCEL_PREFIX = "tickets:delete-cancel:";
export const OPEN_PREFIX = "tickets:open:";
export const CLOSE_PREFIX = "tickets:close:";
export const CLOSE_CONFIRM_PREFIX = "tickets:close-confirm:";
export const DELETE_PREFIX = "tickets:delete:";
export const DELETE_CONFIRM_PREFIX = "tickets:delete-confirm:";
export const ROLE_ACTION_PREFIX = "tickets:role-action:";
export function buildConfirmRow(yesCustomId, noCustomId, yesLabel, noLabel) {
    const yes = new ButtonBuilder()
        .setCustomId(yesCustomId)
        .setLabel(yesLabel.slice(0, 80))
        .setStyle(ButtonStyle.Danger);
    const no = new ButtonBuilder()
        .setCustomId(noCustomId)
        .setLabel(noLabel.slice(0, 80))
        .setStyle(ButtonStyle.Secondary);
    return new ActionRowBuilder().addComponents(yes, no);
}
export function buildPanelPayload(typeId) {
    const ticketType = resolveTicketType(typeId);
    if (!ticketType)
        throw new Error(`Unknown ticket type "${typeId}".`);
    validateTicketType(ticketType);
    const embed = buildEmbed({
        title: ticketType.panelTitle,
        description: ticketType.panelDescription,
    });
    const button = new ButtonBuilder()
        .setCustomId(`${OPEN_PREFIX}${typeId}`)
        .setLabel(ticketType.openButtonLabel.slice(0, 80))
        .setStyle(ButtonStyle.Primary);
    applyEmojiToButton(button, ticketType.emoji);
    const row = new ActionRowBuilder().addComponents(button);
    return {
        embeds: [embed.toJSON()],
        components: [row.toJSON()],
    };
}
export async function publishPanel(ctx, typeId, channelId, existingMessageId) {
    const payload = buildPanelPayload(typeId);
    return publishDiscordMessage(ctx, channelId, payload, existingMessageId);
}
//# sourceMappingURL=panel.js.map