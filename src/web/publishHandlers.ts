import { publishRolePanel, unpublishRolePanel } from '../modules/reaction-roles/index.js';
import { publishTicketPanel, unpublishTicketPanel } from '../modules/tickets/index.js';
import type { DiscordApiContext } from '../core/panelPublish.js';

export interface PublishHandlers {
  publish: (ctx: DiscordApiContext, itemId: string) => Promise<void>;
  unpublish: (itemId: string) => Promise<void>;
}

/** Maps module namespace to publish/unpublish implementations. */
export const publishHandlersByNamespace: Record<string, PublishHandlers> = {
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
