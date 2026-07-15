import type { CommandModule } from "../../moduleLoader.js";
import { NAMESPACE } from "../../lib/modules/custom-embeds/config-io.js";
import { initPublishOnly } from "./handlers.js";

const customEmbedsModule: CommandModule = {
  name: NAMESPACE,
  init: initPublishOnly,
};

export default customEmbedsModule;
