import type { PublishHandlers } from "../../../shared/core/panelPublishBridge.js";
import {
  publishEmbedPanel,
  unpublishEmbedPanel,
} from "../lib/modules/custom-embeds/publisher.js";
import {
  publishRolePanel,
  unpublishRolePanel,
} from "../lib/modules/reaction-roles/publisher.js";
import {
  publishTicketPanel,
  unpublishTicketPanel,
} from "../lib/modules/tickets/publisher.js";

export type { PublishHandlers };

export const publishHandlersByNamespace: Record<string, PublishHandlers> = {
  "custom-embeds": {
    publish: publishEmbedPanel,
    unpublish: unpublishEmbedPanel,
  },
  tickets: {
    publish: publishTicketPanel,
    unpublish: unpublishTicketPanel,
  },
  "reaction-roles": {
    publish: publishRolePanel,
    unpublish: unpublishRolePanel,
  },
};

export function getPublishHandlers(
  namespace: string,
): PublishHandlers | undefined {
  return publishHandlersByNamespace[namespace];
}