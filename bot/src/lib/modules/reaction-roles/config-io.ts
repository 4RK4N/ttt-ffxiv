import { createConfigIo } from "../../core/configIo.js";
import {
  NAMESPACE,
  type RolePanelConfig,
} from "@shared/modules/reaction-roles/types.js";
export * from "@shared/modules/reaction-roles/types.js";

const io = createConfigIo<RolePanelConfig>(NAMESPACE, "panels");
export const updateRolePanel = io.updateItem;
export const getRolePanelConfig = io.getItemConfig;
