import { REST, Routes } from "discord.js";
import { closeDb } from "#shared/core/db.js";
import { MODULE_NAMESPACES } from "#shared/core/moduleTable.js";
import { reloadAllModuleStores } from "#shared/core/texts.js";
import { config, initConfig } from "#shared/config.js";
import { loadModules } from "#bot/moduleLoader.js";

async function main(): Promise<void> {
  await initConfig({ readonly: true });
  await reloadAllModuleStores([...MODULE_NAMESPACES]);
  const { commandData } = await loadModules({ skipDisabledCommands: true });

  if (commandData.length === 0) {
    console.log("No commands found to deploy.");
    return;
  }

  const rest = new REST().setToken(config.discordToken);

  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);

  const scope = config.guildId ? `guild ${config.guildId}` : "globally";
  console.log(`Deploying ${commandData.length} command(s) ${scope}...`);

  const data = (await rest.put(route, { body: commandData })) as unknown[];

  console.log(`Successfully deployed ${data.length} command(s) ${scope}.`);
  if (!config.guildId) {
    console.log(
      "Note: global commands can take up to ~1 hour to appear in all servers.",
    );
  }
}

main()
  .catch((err) => {
    console.error("Failed to deploy commands:", err);
    process.exit(1);
  })
  .finally(() => closeDb());
