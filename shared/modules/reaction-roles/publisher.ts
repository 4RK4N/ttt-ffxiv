import { createPanelPublisher } from '../../core/panelPublisher.js';
import { getPanelConfig, resolvePanel, updatePanel } from './config-io.js';
import { publishPanel, type DiscordApiContext } from './panel.js';

const panelPublisher = createPanelPublisher({
  resolve: resolvePanel,
  getConfig: getPanelConfig,
  update: updatePanel,
  publishPanel,
  entityLabel: 'panel',
});

export async function publishRolePanel(ctx: DiscordApiContext, panelId: string): Promise<void> {
  return panelPublisher.publish(ctx, panelId);
}

export async function unpublishRolePanel(panelId: string): Promise<void> {
  return panelPublisher.unpublish(panelId);
}
