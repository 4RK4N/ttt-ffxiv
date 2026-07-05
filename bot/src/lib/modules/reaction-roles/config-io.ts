import { createConfigIo } from "../../core/configIo.js";
import type { RolePanelConfig } from "../../../../../shared/modules/reaction-roles/types.js";
import {
  CONFIG_DEFAULTS,
  NAMESPACE,
  config,
  findPanelByMessageId,
  resolveOption,
  resolvePanel,
  texts,
} from "../../../../../shared/modules/reaction-roles/types.js";

const io = createConfigIo<RolePanelConfig>(
  NAMESPACE,
  "panels",
  CONFIG_DEFAULTS,
);

export const updatePanel = io.updateItem;
export const getPanelConfig = io.getItemConfig;

export {
  NAMESPACE,
  CONFIG_DEFAULTS,
  config,
  texts,
  resolvePanel,
  findPanelByMessageId,
  resolveOption,
};
