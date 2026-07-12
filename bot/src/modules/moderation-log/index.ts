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
      console.warn(
        "[moderation-log] No channelId configured in " +
          "data/moderation-log/config.json; moderation logging is disabled.",
      );
    }

    registerModerationLogHandlers(client);
  },
};

export default moderationLogModule;
