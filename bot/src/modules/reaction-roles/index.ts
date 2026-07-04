import type { MessageComponentInteraction } from 'discord.js';
import type { CommandModule } from '../../moduleLoader.js';
import { NAMESPACE } from '../../../../shared/modules/reaction-roles/config-io.js';
import { handleButtonInteraction } from './handle-button.js';
import { registerReactionHandlers } from './handle-reaction.js';
import { handleSelectInteraction } from './handle-select.js';

async function handleComponent(interaction: MessageComponentInteraction): Promise<void> {
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
    return;
  }
  if (interaction.isStringSelectMenu()) {
    await handleSelectInteraction(interaction);
  }
}

const reactionRolesModule: CommandModule = {
  name: NAMESPACE,
  init: registerReactionHandlers,
  componentRoutes: [{ prefix: 'reaction-roles:', handle: handleComponent }],
};

export default reactionRolesModule;
