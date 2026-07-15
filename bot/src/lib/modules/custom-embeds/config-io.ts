import { createConfigIo } from "../../core/configIo.js";
import {
  NAMESPACE,
  type EmbedPanelConfig,
} from "@shared/modules/custom-embeds/types.js";
export * from "@shared/modules/custom-embeds/types.js";

const io = createConfigIo<EmbedPanelConfig>(NAMESPACE, "panels");
export const updateEmbedPanel = io.updateItem;
export const getEmbedPanelConfig = io.getItemConfig;
