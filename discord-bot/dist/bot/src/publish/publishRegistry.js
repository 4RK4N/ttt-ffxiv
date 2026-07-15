import { PANEL_MODULE_NAMESPACES } from "#shared/core/panelModuleRegistry.js";
import { publishEmbedPanel, unpublishEmbedPanel, } from "../lib/modules/custom-embeds/publisher.js";
import { publishRolePanel, unpublishRolePanel, } from "../lib/modules/reaction-roles/publisher.js";
import { publishTicketPanel, unpublishTicketPanel, } from "../lib/modules/tickets/publisher.js";
export const publishHandlersByNamespace = {
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
for (const namespace of PANEL_MODULE_NAMESPACES) {
    if (!publishHandlersByNamespace[namespace]) {
        throw new Error(`[publishRegistry] Missing publish handlers for panel module "${namespace}".`);
    }
}
//# sourceMappingURL=publishRegistry.js.map