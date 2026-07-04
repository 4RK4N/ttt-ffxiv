import { publishEmbedPanel, unpublishEmbedPanel } from '../../shared/modules/custom-embeds/publisher.js';
import { publishRolePanel, unpublishRolePanel } from '../../shared/modules/reaction-roles/publisher.js';
import { publishTicketPanel, unpublishTicketPanel } from '../../shared/modules/tickets/publisher.js';
import type { DiscordApiContext } from '../../shared/core/panelPublish.js';

export interface PublishHandlers {
  publish: (ctx: DiscordApiContext, itemId: string) => Promise<void>;
  unpublish: (itemId: string) => Promise<void>;
}

/** Maps module namespace to publish/unpublish implementations. */
export const publishHandlersByNamespace: Record<string, PublishHandlers> = {
  'custom-embeds': {
    publish: publishEmbedPanel,
    unpublish: unpublishEmbedPanel,
  },
  tickets: {
    publish: publishTicketPanel,
    unpublish: unpublishTicketPanel,
  },
  'reaction-roles': {
    publish: publishRolePanel,
    unpublish: unpublishRolePanel,
  },
};

export function getPublishHandlers(namespace: string): PublishHandlers | undefined {
  return publishHandlersByNamespace[namespace];
}
