import { Client, Events, GatewayIntentBits, MessageFlags, type Interaction } from 'discord.js';
import { config } from './config.js';
import { loadModules } from './core/moduleLoader.js';

// Generic fallback shown when a command handler throws. Not module-specific, so
// it stays in code rather than a module's texts.json.
const COMMAND_ERROR_MESSAGE = 'Something went wrong while handling your command. Please try again.';

const COMPONENT_ERROR_MESSAGE =
  'Something went wrong while handling that interaction. Please try again.';

async function main(): Promise<void> {
  // Guilds: interaction handling. GuildMessages + MessageContent: the auto-thread
  // module needs to read message text/attachments to detect posts. GuildMembers:
  // the welcome module needs the guildMemberAdd event. MessageContent and
  // GuildMembers are privileged intents and must be enabled in the Discord
  // Developer Portal.
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  });

  const { handlers, inits, componentRoutes } = await loadModules();
  console.log(`Registered ${handlers.size} command handler(s).`);

  for (const init of inits) {
    try {
      await init(client);
    } catch (err) {
      console.error('Failed to initialize a module:', err);
    }
  }

  client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user.tag}.`);
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isMessageComponent()) {
      const route = componentRoutes.find((r) => interaction.customId.startsWith(r.prefix));
      if (!route) return;

      try {
        await route.handle(interaction);
      } catch (err) {
        console.error(`Error handling component "${interaction.customId}":`, err);
        const message = COMPONENT_ERROR_MESSAGE;
        try {
          if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: message, components: [] });
          } else {
            await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
          }
        } catch (replyErr) {
          console.error('Failed to send component error response:', replyErr);
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
          await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
        }
      } catch (replyErr) {
        console.error('Failed to send error response:', replyErr);
      }
    }
  });

  // Graceful shutdown: Docker sends SIGTERM on `compose up --build`/stop. Without
  // this, the process ignores it and Docker waits the full stop grace period
  // before SIGKILL, making container recreation slow. Destroy the gateway
  // connection and exit promptly instead. A short timer guarantees we exit even
  // if client.destroy() hangs.
  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down...`);

    const forceExit = setTimeout(() => {
      console.warn('Shutdown timed out; forcing exit.');
      process.exit(0);
    }, 5000);
    forceExit.unref();

    void Promise.resolve(client.destroy())
      .catch((err) => console.error('Error during shutdown:', err))
      .finally(() => {
        clearTimeout(forceExit);
        process.exit(0);
      });
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT', () => shutdown('SIGINT'));

  await client.login(config.discordToken);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
