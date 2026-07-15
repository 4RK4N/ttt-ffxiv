/**
 * Panel publish/unpublish — panel modules only (delete for simple modules).
 *
 * Uncomment when panel types live in shared/modules/<name>/types.ts and config-io.ts
 * exports resolve* / get*Config / update*. Add the namespace to
 * shared/core/panelModuleRegistry.ts (publish + web-admin validation).
 */
/*
import { createPanelPublisher } from '../../core/panelPublisher.js';
import {
  getExamplePanelConfig,
  resolveExamplePanel,
  updateExamplePanel,
} from './config-io.js';
import { publishPanel, type DiscordApiContext } from './panel.js';

const panelPublisher = createPanelPublisher({
  resolve: resolveExamplePanel,
  getConfig: getExamplePanelConfig,
  update: updateExamplePanel,
  publishPanel,
  entityLabel: 'example panel',
});

export async function publishExamplePanel(
  ctx: DiscordApiContext,
  panelId: string,
): Promise<void> {
  return panelPublisher.publish(ctx, panelId);
}

export async function unpublishExamplePanel(panelId: string): Promise<void> {
  return panelPublisher.unpublish(panelId);
}
*/
