import { Events, type Client } from "discord.js";
import type { CommandModule } from "../../moduleLoader.js";
import { isModuleEnabled } from "@shared/core/texts.js";
import { registerSafeHandler } from "../../lib/core/discordEvents.js";
import {
  NAMESPACE,
  welcomeChannelId,
} from "../../lib/modules/welcome-message/config-io.js";
import { handleMemberAdd } from "./handlers.js";

const welcomeMessageModule: CommandModule = {
  name: NAMESPACE,
  init(client: Client): void {
    if (!welcomeChannelId()) {
      console.warn(`[${NAMESPACE}] No channelId configured — module idle.`);
      return;
    }

    registerSafeHandler(
      client,
      Events.GuildMemberAdd,
      (member) => {
        if (!isModuleEnabled(NAMESPACE)) return;
        return handleMemberAdd(member);
      },
      "[welcome-message]",
    );
  },
};

export default welcomeMessageModule;
