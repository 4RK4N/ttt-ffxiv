import { closeDb } from "@shared/core/db.js";
import { registerPublishHandlers } from "@shared/core/panelPublishBridge.js";
import { initConfig } from "@shared/config.js";
import { MODULE_NAMESPACES } from "@shared/core/moduleTable.js";
import { reloadAllModuleStores } from "@shared/core/texts.js";
import { startWeb } from "../../web-admin/src/server.js";
import { publishHandlersByNamespace } from "./publish/publishRegistry.js";
import { startBot } from "./index.js";

async function main(): Promise<void> {
  await initConfig();
  registerPublishHandlers(publishHandlersByNamespace);
  await reloadAllModuleStores([...MODULE_NAMESPACES]);

  const web = await startWeb();
  const bot = await startBot();

  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down...`);

    const forceExit = setTimeout(() => {
      console.warn("Shutdown timed out; forcing exit.");
      process.exit(0);
    }, 5000);
    forceExit.unref();

    void Promise.all([
      bot.destroy().catch((err) => console.error("Bot shutdown error:", err)),
      web.close().catch((err) => console.error("Web shutdown error:", err)),
      closeDb().catch((err) => console.error("Database close error:", err)),
    ]).finally(() => {
      clearTimeout(forceExit);
      process.exit(0);
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
