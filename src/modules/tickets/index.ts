import { type ButtonInteraction, type MessageComponentInteraction } from 'discord.js';
import type { CommandModule, ComponentRoute } from '../../core/moduleLoader.js';
import { updateTicketType } from './config-io.js';
import { publishPanel, type DiscordApiContext } from './panel.js';
import { handleCloseCancel, handleCloseTicket } from './close.js';
import { handleDeleteCancel, handleDeleteTicket } from './delete.js';
import { handleOpenTicket } from './open.js';
import { getTicketTypeConfig } from './config-io.js';
import { registerMemberCacheWarm } from './member-cache.js';
import { resolveTicketType, NAMESPACE } from './types.js';

async function handleComponent(interaction: MessageComponentInteraction): Promise<void> {
  if (!interaction.isButton()) return;

  const { customId } = interaction;

  if (customId.startsWith('tickets:open:')) {
    await handleOpenTicket(interaction);
    return;
  }

  if (customId.startsWith('tickets:close-cancel:')) {
    await handleCloseCancel(interaction);
    return;
  }

  if (customId.startsWith('tickets:delete-cancel:')) {
    await handleDeleteCancel(interaction);
    return;
  }

  if (customId.startsWith('tickets:delete-confirm:') || customId.startsWith('tickets:delete:')) {
    await handleDeleteTicket(interaction as ButtonInteraction);
    return;
  }

  if (customId.startsWith('tickets:close:') || customId.startsWith('tickets:close-confirm:')) {
    await handleCloseTicket(interaction as ButtonInteraction);
  }
}

export async function publishTicketPanel(ctx: DiscordApiContext, typeId: string): Promise<void> {
  const ticketType = resolveTicketType(typeId);
  if (!ticketType) throw new Error(`Unknown ticket type "${typeId}".`);
  if (!ticketType.channelId.trim()) throw new Error('Channel is not configured for this ticket type.');

  const messageId = await publishPanel(
    ctx,
    typeId,
    ticketType.channelId,
    ticketType.panelMessageId || undefined
  );

  await updateTicketType(typeId, {
    published: true,
    panelMessageId: messageId,
  });
}

export async function unpublishTicketPanel(typeId: string): Promise<void> {
  if (!getTicketTypeConfig(typeId)) throw new Error(`Unknown ticket type "${typeId}".`);

  await updateTicketType(typeId, { published: false });
}

const ticketsModule: CommandModule = {
  name: NAMESPACE,
  init: registerMemberCacheWarm,
  componentRoutes: [{ prefix: 'tickets:', handle: handleComponent }],
};

export default ticketsModule;
