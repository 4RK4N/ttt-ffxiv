import { jsx as _jsx } from "hono/jsx/jsx-runtime";
import { readEnabled } from "../store.js";
import { buildEditorModule, loadEditorContext } from "./editor/data.js";
import { EditorLayout } from "./editor/layout.js";
import { ModulePanel } from "./editor/ModulePanel.js";
export async function EditorPage({ cfg, user, csrfToken, cspNonce, plugins, activeNamespace, }) {
    const ctx = await loadEditorContext(cfg, csrfToken);
    const activePlugin = plugins.find((p) => p.namespace === (activeNamespace ?? plugins[0]?.namespace)) ?? plugins[0];
    const mod = activePlugin ? buildEditorModule(activePlugin) : null;
    const pluginList = plugins.map((p) => ({
        namespace: p.namespace,
        title: p.title,
        enabled: readEnabled(p.namespace),
    }));
    const panel = mod ? _jsx(ModulePanel, { mod: mod, ctx: ctx, expanded: [] }) : null;
    return (_jsx(EditorLayout, { title: `${cfg.botName} Admin Interface`, username: user.username, csrfToken: csrfToken, cspNonce: cspNonce, plugins: pluginList, activeNamespace: activePlugin?.namespace ?? "", panel: panel }));
}
//# sourceMappingURL=editor-page.js.map