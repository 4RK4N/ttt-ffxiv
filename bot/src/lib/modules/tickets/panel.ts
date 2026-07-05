import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { buildEmbed } from "../../core/embedBuilder.js";
import { parseEmoji } from "../../../../../shared/core/discordEmoji.js";
import {
  publishDiscordMessage,
  type DiscordApiContext,
} from "../../core/panelPublish.js";
import { resolveTicketType } from "./config-io.js";

export type { DiscordApiContext };

export const OPEN_PREFIX = "tickets:open:";
export const CLOSE_PREFIX = "tickets:close:";
export const CLOSE_CONFIRM_PREFIX = "tickets:close-confirm:";
export const DELETE_PREFIX = "tickets:delete:";
export const DELETE_CONFIRM_PREFIX = "tickets:delete-confirm:";
export const ROLE_ACTION_PREFIX = "tickets:role-action:";

export function buildConfirmRow(
  yesCustomId: string,
  noCustomId: string,
  yesLabel: string,
  noLabel: string,
): ActionRowBuilder<ButtonBuilder> {
  const yes = new ButtonBuilder()
    .setCustomId(yesCustomId)
    .setLabel(yesLabel.slice(0, 80))
    .setStyle(ButtonStyle.Danger);

  const no = new ButtonBuilder()
    .setCustomId(noCustomId)
    .setLabel(noLabel.slice(0, 80))
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(yes, no);
}

export function buildPanelPayload(typeId: string) {
  const ticketType = resolveTicketType(typeId);
  if (!ticketType) throw new Error(`Unknown ticket type "${typeId}".`);

  const embed = buildEmbed({
    title: ticketType.panelTitle,
    description: ticketType.panelDescription,
  });

  const button = new ButtonBuilder()
    .setCustomId(`${OPEN_PREFIX}${typeId}`)
    .setLabel(ticketType.openButtonLabel.slice(0, 80))
    .setStyle(ButtonStyle.Primary);

  const parsedEmoji = parseEmoji(ticketType.emoji);
  if (parsedEmoji) {
    button.setEmoji(
      parsedEmoji.id
        ? { id: parsedEmoji.id, name: parsedEmoji.name }
        : parsedEmoji,
    );
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  return {
    embeds: [embed.toJSON()],
    components: [row.toJSON()],
  };
}

export async function publishPanel(
  ctx: DiscordApiContext,
  typeId: string,
  channelId: string,
  existingMessageId?: string,
): Promise<string> {
  const payload = buildPanelPayload(typeId);
  return publishDiscordMessage(ctx, channelId, payload, existingMessageId);
}
