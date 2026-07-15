import { NAMESPACE, logChannelId, } from "../../lib/modules/moderation-log/config-io.js";
import { registerModerationLogHandlers } from "./handlers.js";
const moderationLogModule = {
    name: NAMESPACE,
    init(client) {
        if (!logChannelId()) {
            console.warn(`[${NAMESPACE}] No channelId configured — module idle.`);
            return;
        }
        registerModerationLogHandlers(client);
    },
};
export default moderationLogModule;
//# sourceMappingURL=index.js.map