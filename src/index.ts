import { Client, Events, GatewayIntentBits, type Interaction } from 'discord.js';
import { config } from './config.js';
import { loadModules } from './core/moduleLoader.js';

async function main(): Promise<void> {
  // Only the Guilds intent is needed: we send messages/attachments in response to
  // interactions, which requires no privileged (message content / members) intents.
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  const { handlers } = await loadModules();
  console.log(`Registered ${handlers.size} command handler(s).`);

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
      const message = 'Something went wrong while handling your command. Please try again.';
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(message);
        } else {
          await interaction.reply({ content: message, ephemeral: true });
        }
      } catch (replyErr) {
        console.error('Failed to send error response:', replyErr);
      }
    }
  });

  await client.login(config.token);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
