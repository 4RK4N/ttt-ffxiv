import { NAMESPACE } from "../../lib/modules/reaction-roles/config-io.js";
import { handleButtonInteraction } from "./handle-button.js";
import { registerReactionHandlers } from "./handle-reaction.js";
import { handleSelectInteraction } from "./handle-select.js";
async function handleComponent(interaction) {
    if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
        return;
    }
    if (interaction.isStringSelectMenu()) {
        await handleSelectInteraction(interaction);
    }
}
const reactionRolesModule = {
    name: NAMESPACE,
    init: registerReactionHandlers,
    componentRoutes: [{ prefix: "reaction-roles:", handle: handleComponent }],
};
export default reactionRolesModule;
//# sourceMappingURL=index.js.map