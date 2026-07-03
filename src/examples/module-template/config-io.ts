/**
 * Config IO boundary — the import surface for handlers, panels, and publish code.
 *
 * ## Simple modules (this template's default)
 *
 * Re-export read accessors from types.ts. No runtime writes happen here:
 * - config.json / texts.json are edited by hand or the web editor (src/web/store.ts)
 * - reads go through config() / texts() (mtime-cached in src/core/texts.ts)
 *
 * ## Panel modules
 *
 * Uncomment the panel block below. createConfigIo patches list items in config.json
 * at runtime when publishing/unpublishing (published, panelMessageId, channelId).
 * Texts are still web-editor only — no text-io.ts.
 *
 * Usage after publish (panel modules):
 *
 *   import { getExamplePanelConfig, updateExamplePanel } from './config-io.js';
 *
 *   const row = getExamplePanelConfig(panelId);
 *   await updateExamplePanel(panelId, {
 *     published: true,
 *     panelMessageId: message.id,
 *     channelId: targetChannel,
 *   });
 *
 * Import config/texts from HERE in handlers (not from types.ts) so simple and panel
 * modules share the same pattern.
 */

// --- Simple module: read-only barrel ------------------------------------------

export {
  NAMESPACE,
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
  config,
  texts,
  targetChannelId,
} from './types.js';

// --- Panel module: runtime config list patches (uncomment; remove barrel above) -
/*
import { createConfigIo } from '../../core/configIo.js';
import type { ExamplePanelConfig } from './types.js';
import { CONFIG_DEFAULTS, NAMESPACE, config, texts } from './types.js';

const io = createConfigIo<ExamplePanelConfig>(NAMESPACE, 'panels', CONFIG_DEFAULTS);

export const updateExamplePanel = io.updateItem;
export const getExamplePanelConfig = io.getItemConfig;

export { NAMESPACE, CONFIG_DEFAULTS, config, texts };
*/
