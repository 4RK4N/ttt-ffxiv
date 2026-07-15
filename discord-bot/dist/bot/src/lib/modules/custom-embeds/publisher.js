import { createPanelPublisher } from "../../core/panelPublisher.js";
import { getEmbedPanelConfig, resolveEmbedPanel, updateEmbedPanel, } from "./config-io.js";
import { publishPanel } from "./panel.js";
export const { publish: publishEmbedPanel, unpublish: unpublishEmbedPanel } = createPanelPublisher({
    resolve: resolveEmbedPanel,
    getConfig: getEmbedPanelConfig,
    update: updateEmbedPanel,
    publishPanel,
    entityLabel: "embed panel",
});
//# sourceMappingURL=publisher.js.map