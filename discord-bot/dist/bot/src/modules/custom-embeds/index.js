import { NAMESPACE } from "../../lib/modules/custom-embeds/config-io.js";
import { initPublishOnly } from "./handlers.js";
const customEmbedsModule = {
    name: NAMESPACE,
    init: initPublishOnly,
};
export default customEmbedsModule;
//# sourceMappingURL=index.js.map