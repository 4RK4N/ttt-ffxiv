import { createConfigIo } from "../../core/configIo.js";
import { NAMESPACE, } from "#shared/modules/custom-embeds/types.js";
export * from "#shared/modules/custom-embeds/types.js";
const io = createConfigIo(NAMESPACE, "panels");
export const updateEmbedPanel = io.updateItem;
export const getEmbedPanelConfig = io.getItemConfig;
//# sourceMappingURL=config-io.js.map