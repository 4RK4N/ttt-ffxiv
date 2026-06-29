import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from 'discord.js';
import { discordBotFetch } from '../../core/discordApi.js';
import { resolveTicketType } from './types.js';

export const OPEN_PREFIX = 'tickets:open:';
export const CLOSE_PREFIX = 'tickets:close:';
export const CLOSE_CONFIRM_PREFIX = 'tickets:close-confirm:';
export const DELETE_PREFIX = 'tickets:delete:';
export const DELETE_CONFIRM_PREFIX = 'tickets:delete-confirm:';

export interface DiscordApiContext {
  botToken: string;
}

function parseEmoji(emoji: string): { name: string } | undefined {
  const trimmed = emoji.trim();
  if (!trimmed) return undefined;
  const custom = trimmed.match(/^<a?:(\w+):\d+>$/);
  if (custom) return { name: custom[1] };
  return { name: trimmed };
}

export function buildPanelPayload(typeId: string) {
  const ticketType = resolveTicketType(typeId);
  if (!ticketType) throw new Error(`Unknown ticket type "${typeId}".`);

  const embed = new EmbedBuilder()
    .setTitle(ticketType.panelTitle)
    .setDescription(ticketType.panelDescription);

  const button = new ButtonBuilder()
    .setCustomId(`${OPEN_PREFIX}${typeId}`)
    .setLabel(ticketType.openButtonLabel.slice(0, 80))
    .setStyle(ButtonStyle.Primary);

  const parsedEmoji = parseEmoji(ticketType.emoji);
  if (parsedEmoji) button.setEmoji(parsedEmoji);

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
  existingMessageId?: string
): Promise<string> {
  const payload = buildPanelPayload(typeId);

  if (existingMessageId) {
    const editRes = await discordBotFetch(
      ctx.botToken,
      `/channels/${channelId}/messages/${existingMessageId}`,
      { method: 'PATCH', body: JSON.stringify(payload) }
    );
    if (editRes.ok) return existingMessageId;
    if (editRes.status !== 404) {
      throw new Error(`Failed to edit panel message (HTTP ${editRes.status}).`);
    }
  }

  const createRes = await discordBotFetch(ctx.botToken, `/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!createRes.ok) {
    throw new Error(`Failed to post panel message (HTTP ${createRes.status}).`);
  }

  const body = (await createRes.json()) as { id?: string };
  if (!body.id) throw new Error('Discord did not return a message id.');
  return body.id;
}
