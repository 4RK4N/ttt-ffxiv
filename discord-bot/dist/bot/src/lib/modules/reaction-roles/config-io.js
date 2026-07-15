import { createConfigIo } from "../../core/configIo.js";
import { NAMESPACE, } from "#shared/modules/reaction-roles/types.js";
export * from "#shared/modules/reaction-roles/types.js";
const io = createConfigIo(NAMESPACE, "panels");
export const updateRolePanel = io.updateItem;
export const getRolePanelConfig = io.getItemConfig;
//# sourceMappingURL=config-io.js.map