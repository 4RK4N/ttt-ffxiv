import { Events } from "discord.js";
import { isModuleEnabled } from "#shared/core/texts.js";
import { registerSafeHandler } from "../../lib/core/discordEvents.js";
import { NAMESPACE, welcomeChannelId, } from "../../lib/modules/welcome-message/config-io.js";
import { handleMemberAdd } from "./handlers.js";
const welcomeMessageModule = {
    name: NAMESPACE,
    init(client) {
        if (!welcomeChannelId()) {
            console.warn(`[${NAMESPACE}] No channelId configured — module idle.`);
            return;
        }
        registerSafeHandler(client, Events.GuildMemberAdd, (member) => {
            if (!isModuleEnabled(NAMESPACE))
                return;
            return handleMemberAdd(member);
        }, "[welcome-message]");
    },
};
export default welcomeMessageModule;
//# sourceMappingURL=index.js.map