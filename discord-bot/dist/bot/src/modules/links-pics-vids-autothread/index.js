import { Events } from "discord.js";
import { isModuleEnabled } from "#shared/core/texts.js";
import { registerSafeHandler } from "../../lib/core/discordEvents.js";
import { NAMESPACE, channelIds, } from "../../lib/modules/links-pics-vids-autothread/config-io.js";
import { handleMessage } from "./handlers.js";
const linksPicsVidsAutoThreadModule = {
    name: NAMESPACE,
    init(client) {
        if (channelIds().length === 0) {
            console.warn(`[${NAMESPACE}] No channelIds configured — module idle.`);
            return;
        }
        registerSafeHandler(client, Events.MessageCreate, (message) => {
            if (!isModuleEnabled(NAMESPACE))
                return;
            return handleMessage(message);
        }, `[${NAMESPACE}]`);
    },
};
export default linksPicsVidsAutoThreadModule;
//# sourceMappingURL=index.js.map