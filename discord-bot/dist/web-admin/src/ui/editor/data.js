import { listGuildChannels } from "../../channels.js";
import { listGuildRoles } from "../../roles.js";
import { readEnabled, readValues } from "../../store.js";
import { pluginToModule } from "./context.js";
export async function loadEditorContext(cfg, csrfToken) {
    let channels = [];
    let roles = [];
    let channelsError = null;
    let rolesError = null;
    const [channelsSettled, rolesSettled] = await Promise.all([
        listGuildChannels(cfg).then((value) => ({ ok: true, value }), (err) => ({ ok: false, err })),
        listGuildRoles(cfg).then((value) => ({ ok: true, value }), (err) => ({ ok: false, err })),
    ]);
    if (channelsSettled.ok) {
        channels = channelsSettled.value;
    }
    else {
        console.error("[web] Failed to load channels:", channelsSettled.err);
        channelsError = "Could not load channels.";
    }
    if (rolesSettled.ok) {
        roles = rolesSettled.value;
    }
    else {
        console.error("[web] Failed to load roles:", rolesSettled.err);
        rolesError = "Could not load roles.";
    }
    return {
        csrfToken,
        channels,
        roles,
        channelsError,
        rolesError,
    };
}
export function buildEditorModule(plugin) {
    return pluginToModule(plugin, readValues(plugin), readEnabled(plugin.namespace));
}
export function parseExpanded(query) {
    if (!query?.trim())
        return [];
    return query.split(",").filter(Boolean);
}
//# sourceMappingURL=data.js.map