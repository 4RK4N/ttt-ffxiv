import type { MessageComponentInteraction } from 'discord.js';
import type { CommandModule } from '../../core/moduleLoader.js';
import { createPanelPublisher } from '../../core/panelPublisher.js';
import { getPanelConfig, updatePanel } from './config-io.js';
import { handleButtonInteraction } from './handle-button.js';
import { registerReactionHandlers } from './handle-reaction.js';
import { handleSelectInteraction } from './handle-select.js';
import { publishPanel, type DiscordApiContext } from './panel.js';
import { resolvePanel, NAMESPACE } from './config-io.js';

async function handleComponent(interaction: MessageComponentInteraction): Promise<void> {
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
    return;
  }
  if (interaction.isStringSelectMenu()) {
    await handleSelectInteraction(interaction);
  }
}

const panelPublisher = createPanelPublisher({
  resolve: resolvePanel,
  getConfig: getPanelConfig,
  update: updatePanel,
  publishPanel,
  entityLabel: 'panel',
});

export async function publishRolePanel(ctx: DiscordApiContext, panelId: string): Promise<void> {
  return panelPublisher.publish(ctx, panelId);
}

export async function unpublishRolePanel(panelId: string): Promise<void> {
  return panelPublisher.unpublish(panelId);
}

const reactionRolesModule: CommandModule = {
  name: NAMESPACE,
  init: registerReactionHandlers,
  componentRoutes: [{ prefix: 'reaction-roles:', handle: handleComponent }],
};

export default reactionRolesModule;
