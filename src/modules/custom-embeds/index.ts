import type { CommandModule } from '../../core/moduleLoader.js';
import { createPanelPublisher } from '../../core/panelPublisher.js';
import { getEmbedPanelConfig, updateEmbedPanel } from './config-io.js';
import { publishPanel, type DiscordApiContext } from './panel.js';
import { resolveEmbedPanel, NAMESPACE } from './config-io.js';

const panelPublisher = createPanelPublisher({
  resolve: resolveEmbedPanel,
  getConfig: getEmbedPanelConfig,
  update: updateEmbedPanel,
  publishPanel,
  entityLabel: 'embed panel',
});

export async function publishEmbedPanel(ctx: DiscordApiContext, panelId: string): Promise<void> {
  return panelPublisher.publish(ctx, panelId);
}

export async function unpublishEmbedPanel(panelId: string): Promise<void> {
  return panelPublisher.unpublish(panelId);
}

const customEmbedsModule: CommandModule = {
  name: NAMESPACE,
};

export default customEmbedsModule;
