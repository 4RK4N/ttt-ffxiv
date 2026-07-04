import { type ButtonInteraction, type MessageComponentInteraction } from 'discord.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import { createPanelPublisher } from '../../core/panelPublisher.js';
import { getTicketTypeConfig, updateTicketType } from './config-io.js';
import { handleCloseCancel, handleCloseTicket } from './close.js';
import { handleDeleteCancel, handleDeleteTicket } from './delete.js';
import { registerMemberCacheWarm } from './member-cache.js';
import { handleOpenTicket } from './open.js';
import { publishPanel, type DiscordApiContext } from './panel.js';
import { handleRoleAction } from './role-action.js';
import { resolveTicketType, NAMESPACE } from './config-io.js';

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

  if (customId.startsWith('tickets:role-action:')) {
    await handleRoleAction(interaction as ButtonInteraction);
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

const panelPublisher = createPanelPublisher({
  resolve: resolveTicketType,
  getConfig: getTicketTypeConfig,
  update: updateTicketType,
  publishPanel,
  entityLabel: 'ticket type',
});

export async function publishTicketPanel(ctx: DiscordApiContext, typeId: string): Promise<void> {
  return panelPublisher.publish(ctx, typeId);
}

export async function unpublishTicketPanel(typeId: string): Promise<void> {
  return panelPublisher.unpublish(typeId);
}

const ticketsModule: CommandModule = {
  name: NAMESPACE,
  init: registerMemberCacheWarm,
  componentRoutes: [{ prefix: 'tickets:', handle: handleComponent }],
};

export default ticketsModule;
