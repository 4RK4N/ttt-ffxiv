import { Client, Events, GatewayIntentBits, MessageFlags, type Interaction } from 'discord.js';
import { config } from './config.js';
import { loadModules } from './core/moduleLoader.js';

// Generic fallback shown when a command handler throws. Not module-specific, so
// it stays in code rather than a module's texts.json.
const COMMAND_ERROR_MESSAGE = 'Something went wrong while handling your command. Please try again.';

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

  const { handlers, inits } = await loadModules();
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

  await client.login(config.discordToken);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
