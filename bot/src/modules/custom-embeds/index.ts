import type { CommandModule } from "../../moduleLoader.js";
import { NAMESPACE } from "../../lib/modules/custom-embeds/config-io.js";

/** Publish-only module — panels are managed via web-admin; no bot handlers needed. */
const customEmbedsModule: CommandModule = {
  name: NAMESPACE,
  init() {},
};

export default customEmbedsModule;
