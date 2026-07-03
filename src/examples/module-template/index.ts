/**
 * Module entry point.
 *
 * Discovered by src/core/moduleLoader.ts when this file lives at
 * src/modules/<name>/index.ts (compiled to index.js).
 *
 * A valid module exports a CommandModule with at least one of:
 *   commands      — slash commands (/pic, /post, …)
 *   init          — register client.on(...) listeners
 *   componentRoutes — route buttons/selects by customId prefix
 *
 * Panel modules also export publish/unpublish functions and register them in
 * src/web/publishHandlers.ts (not auto-discovered yet).
 */
import {
  Events,
  SlashCommandBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type Client,
  type MessageComponentInteraction,
} from 'discord.js';
import type { CommandModule, ComponentRoute } from '../../core/moduleLoader.js';
import { replyEphemeral } from '../../core/discordInteractions.js';
import { NAMESPACE, targetChannelId } from './config-io.js';
import {
  disabledReply,
  greetingForUser,
  isExampleEnabled,
  logConfigSnapshot,
  replyDisabledEphemeral,
  shouldHandleMessage,
} from './handlers.js';

// =============================================================================
// Pattern A: init — event listeners
// =============================================================================

function initExample(client: Client): void {
  const channelId = targetChannelId();
  if (!channelId) {
    console.warn(
      `[${NAMESPACE}] No channelId in data/${NAMESPACE}/config.json — module idle.`
    );
    return;
  }

  logConfigSnapshot();

  client.on(Events.MessageCreate, (message) => {
    if (!shouldHandleMessage(message)) return;

    void message
      .reply(greetingForUser(message.author.id))
      .catch((err) => console.error(`[${NAMESPACE}] Reply failed:`, err));
  });
}

// =============================================================================
// Pattern B: slash commands
// =============================================================================

async function executeExampleCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!isExampleEnabled()) {
    await interaction.editReply(disabledReply());
    return;
  }

  await interaction.editReply(greetingForUser(interaction.user.id));
}

const exampleCommand = {
  data: new SlashCommandBuilder()
    .setName('example')
    .setDescription('Example slash command — remove or rename before shipping.'),
  execute: executeExampleCommand,
};

// =============================================================================
// Pattern C: component routes (buttons / select menus)
// =============================================================================

async function handleExampleComponent(
  interaction: MessageComponentInteraction
): Promise<void> {
  if (!interaction.isButton()) return;
  // customId convention: '<namespace>:<action>:<id>' — see panel.ts for prefixes

  if (!isExampleEnabled()) {
    await replyDisabledEphemeral(interaction);
    return;
  }

  await replyEphemeral(interaction, greetingForUser(interaction.user.id));
}

const componentRoutes: ComponentRoute[] = [
  { prefix: `${NAMESPACE}:`, handle: handleExampleComponent },
];

// =============================================================================
// Pattern D: panel publish (panel modules only — see panel.ts + config-io.ts)
// =============================================================================

/*
import { createPanelPublisher } from '../../core/panelPublisher.js';
import { getExamplePanelConfig, updateExamplePanel } from './config-io.js';
import { publishPanel, type DiscordApiContext } from './panel.js';
import { resolveExamplePanel } from './types.js';

const panelPublisher = createPanelPublisher({
  resolve: resolveExamplePanel,
  getConfig: getExamplePanelConfig,
  update: updateExamplePanel,
  publishPanel,
  entityLabel: 'example panel',
});

export async function publishExamplePanel(
  ctx: DiscordApiContext,
  panelId: string
): Promise<void> {
  return panelPublisher.publish(ctx, panelId);
}

export async function unpublishExamplePanel(panelId: string): Promise<void> {
  return panelPublisher.unpublish(panelId);
}
*/

// =============================================================================
// Export — enable the patterns you need; delete the rest
// =============================================================================

const exampleModule: CommandModule = {
  name: NAMESPACE,
  init: initExample,
  // Slash commands require `npm run deploy` after changes:
  // commands: [exampleCommand],
  // componentRoutes,
};

export default exampleModule;
