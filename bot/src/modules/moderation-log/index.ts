import type { Client } from "discord.js";
import type { CommandModule } from "../../moduleLoader.js";
import {
  NAMESPACE,
  logChannelId,
} from "../../lib/modules/moderation-log/config-io.js";
import { registerModerationLogHandlers } from "./handlers.js";

const moderationLogModule: CommandModule = {
  name: NAMESPACE,
  init(client: Client): void {
    if (!logChannelId()) {
      console.warn(`[${NAMESPACE}] No channelId configured — module idle.`);
      return;
    }
    registerModerationLogHandlers(client);
  },
};

export default moderationLogModule;
