/**
 * Config IO boundary — the import surface for handlers, panels, and publish code.
 *
 * Handlers import runtime accessors from HERE, not from types.ts.
 * types.ts is for TypeScript interfaces and resolve* implementation only.
 *
 * ## Simple modules (default)
 *
 * Re-export reads from types.ts. Writes go through web editor → web-admin/src/store.ts
 * (which calls invalidateModuleCache so config() / texts() hot-reload).
 *
 * ## Panel modules
 *
 * Uncomment the panel block: createConfigIo patches list items at publish time
 * (published, panelMessageId, channelId). Texts stay web-editor only.
 */
export {
  NAMESPACE,
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
  config,
  texts,
  targetChannelId,
} from "./types.js";

// --- Panel module (uncomment; remove simple barrel above) ---------------------
/*
import { createConfigIo } from '../../core/configIo.js';
import type { ExamplePanelConfig } from '../../../../../shared/modules/<name>/types.js';
import {
  CONFIG_DEFAULTS,
  NAMESPACE,
  config,
  resolveExamplePanel,
  texts,
} from '../../../../../shared/modules/<name>/types.js';

const io = createConfigIo<ExamplePanelConfig>(NAMESPACE, 'panels', CONFIG_DEFAULTS);

export const updateExamplePanel = io.updateItem;
export const getExamplePanelConfig = io.getItemConfig;

export {
  NAMESPACE,
  CONFIG_DEFAULTS,
  config,
  texts,
  resolveExamplePanel,
};
*/
