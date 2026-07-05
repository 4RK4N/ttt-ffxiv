import { createConfigIo } from "../../core/configIo.js";
import type { EmbedPanelConfig } from "../../../../../shared/modules/custom-embeds/types.js";
import {
  CONFIG_DEFAULTS,
  NAMESPACE,
  config,
  resolveEmbedPanel,
  texts,
} from "../../../../../shared/modules/custom-embeds/types.js";

const io = createConfigIo<EmbedPanelConfig>(
  NAMESPACE,
  "panels",
  CONFIG_DEFAULTS,
);

export const updateEmbedPanel = io.updateItem;
export const getEmbedPanelConfig = io.getItemConfig;

export { NAMESPACE, CONFIG_DEFAULTS, config, texts, resolveEmbedPanel };
