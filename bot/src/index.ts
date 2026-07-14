import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  type Interaction,
} from "discord.js";
import { config } from "../../shared/config.js";
import { loadModules } from "./moduleLoader.js";

const COMMAND_ERROR_MESSAGE =
  "Something went wrong while handling your command. Please try again.";

const COMPONENT_ERROR_MESSAGE =
  "Something went wrong while handling that interaction. Please try again.";

export interface BotRuntime {
  client: Client;
  destroy: () => Promise<void>;
}

export async function startBot(): Promise<BotRuntime> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.GuildMember],
  });

  const { handlers, inits, componentRoutes } = await loadModules();
  console.log(`Registered ${handlers.size} command handler(s).`);

  for (const init of inits) {
    try {
      await init(client);
    } catch (err) {
      console.error("Failed to initialize a module:", err);
    }
  }

  client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}.`);
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isMessageComponent()) {
      const route = componentRoutes.find((r) =>
        interaction.customId.startsWith(r.prefix),
      );
      if (!route) return;

      try {
        await route.handle(interaction);
      } catch (err) {
        console.error(
          `Error handling component "${interaction.customId}":`,
          err,
        );
        const message = COMPONENT_ERROR_MESSAGE;
        try {
          if (interaction.deferred || interaction.replied) {
            const panelSafe =
              interaction.isMessageComponent() &&
              interaction.deferred &&
              !interaction.ephemeral;
            if (panelSafe) {
              await interaction.followUp({
                content: message,
                flags: MessageFlags.Ephemeral,
              });
            } else {
              await interaction.editReply({ content: message });
            }
          } else {
            await interaction.reply({
              content: message,
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch (replyErr) {
          console.error("Failed to send component error response:", replyErr);
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const execute = handlers.get(interaction.commandName);
    if (!execute) {
      console.warn(`No handler for command "${interaction.commandName}".`);
      return;
    }

    try {
      await execute(interaction);
    } catch (err) {
      console.error(`Error handling "/${interaction.commandName}":`, err);
      const message = COMMAND_ERROR_MESSAGE;
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(message);
        } else {
          await interaction.reply({
            content: message,
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (replyErr) {
        console.error("Failed to send error response:", replyErr);
      }
    }
  });

  await client.login(config.discordToken);

  return {
    client,
    destroy: () => client.destroy(),
  };
}
