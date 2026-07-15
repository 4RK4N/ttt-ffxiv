import { createPanelPublisher } from "../../core/panelPublisher.js";
import { getTicketTypeConfig, resolveTicketType, updateTicketType, } from "./config-io.js";
import { publishPanel } from "./panel.js";
export const { publish: publishTicketPanel, unpublish: unpublishTicketPanel } = createPanelPublisher({
    resolve: resolveTicketType,
    getConfig: getTicketTypeConfig,
    update: updateTicketType,
    publishPanel,
    entityLabel: "ticket type",
});
//# sourceMappingURL=publisher.js.map