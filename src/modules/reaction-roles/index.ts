import type { MessageComponentInteraction } from 'discord.js';
import type { CommandModule, ComponentRoute } from '../../core/moduleLoader.js';
import { getPanelConfig, updatePanel } from './config-io.js';
import { handleButtonInteraction } from './handle-button.js';
import { registerReactionHandlers } from './handle-reaction.js';
import { handleSelectInteraction } from './handle-select.js';
import { publishPanel, type DiscordApiContext } from './panel.js';
import { resolvePanel, NAMESPACE } from './types.js';

async function handleComponent(interaction: MessageComponentInteraction): Promise<void> {
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
    return;
  }
  if (interaction.isStringSelectMenu()) {
    await handleSelectInteraction(interaction);
  }
}

export async function publishRolePanel(ctx: DiscordApiContext, panelId: string): Promise<void> {
  const panel = resolvePanel(panelId);
  if (!panel) throw new Error(`Unknown panel "${panelId}".`);
  if (!panel.channelId.trim()) throw new Error('Channel is not configured for this panel.');

  const messageId = await publishPanel(
    ctx,
    panelId,
    panel.channelId,
    panel.panelMessageId || undefined
  );

  await updatePanel(panelId, {
    published: true,
    panelMessageId: messageId,
  });
}

export async function unpublishRolePanel(panelId: string): Promise<void> {
  if (!getPanelConfig(panelId)) throw new Error(`Unknown panel "${panelId}".`);
  await updatePanel(panelId, { published: false });
}

const reactionRolesModule: CommandModule = {
  name: NAMESPACE,
  init: registerReactionHandlers,
  componentRoutes: [{ prefix: 'reaction-roles:', handle: handleComponent }],
};

export default reactionRolesModule;
