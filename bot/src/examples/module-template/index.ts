/**
 * Module entry point — discovered by bot/src/moduleLoader.ts at
 * bot/src/modules/<name>/index.ts (compiled to index.js).
 */
import {
  Events,
  SlashCommandBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type Client,
  type MessageComponentInteraction,
} from "discord.js";
import type { CommandModule, ComponentRoute } from "../../moduleLoader.js";
import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import {
  NAMESPACE,
  targetChannelId,
} from "../../lib/modules/example-module/config-io.js";
import {
  disabledReply,
  greetingForUser,
  isExampleEnabled,
  replyDisabledEphemeral,
  shouldHandleMessage,
} from "./handlers.js";

// =============================================================================
// Pattern A: init — event listeners
// =============================================================================

function initExample(client: Client): void {
  if (!targetChannelId()) {
    console.warn(
      `[${NAMESPACE}] No channelId in data/${NAMESPACE}/config.json — module idle.`,
    );
    return;
  }

  client.on(Events.MessageCreate, (message) => {
    if (!shouldHandleMessage(message)) return;

    void message
      .reply(greetingForUser(message.author.id))
      .catch((err) => console.error(`[${NAMESPACE}] Reply failed:`, err));
  });
}

// =============================================================================
// Pattern B: slash commands (requires npm run deploy)
// =============================================================================

async function executeExampleCommand(
  interaction: ChatInputCommandInteraction,
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
    .setName("example")
    .setDescription(
      "Example slash command — remove or rename before shipping.",
    ),
  execute: executeExampleCommand,
};

// =============================================================================
// Pattern C: component routes
// =============================================================================

async function handleExampleComponent(
  interaction: MessageComponentInteraction,
): Promise<void> {
  if (!interaction.isButton()) return;

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
// Pattern D: panel publish (panel modules — see lib/modules/<name>/publisher.ts)
// =============================================================================

/*
Register in bot/src/internal-api/publishRegistry.ts after uncommenting publisher.ts.
See bot/src/lib/modules/example-module/publisher.ts and tickets/publisher.ts.
*/

// =============================================================================
// Pattern E: comments thread (see handlers.ts startExampleCommentsThread)
// =============================================================================

/*
import { startExampleCommentsThread } from './handlers.js';
// After posting a message: await startExampleCommentsThread(sent, displayName, caption, texts().threadFirstMessage);
*/

const exampleModule: CommandModule = {
  name: NAMESPACE,
  init: initExample,
  // commands: [exampleCommand],
  // componentRoutes,
};

export default exampleModule;
