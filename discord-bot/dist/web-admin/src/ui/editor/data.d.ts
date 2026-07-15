import type { WebPlugin } from "../../plugin-types.js";
import type { WebConfig } from "../../config.js";
import type { EditorContext } from "./context.js";
export declare function loadEditorContext(cfg: WebConfig, csrfToken: string): Promise<EditorContext>;
export declare function buildEditorModule(plugin: WebPlugin): import("../../plugin-types.js").EditorModule;
export declare function parseExpanded(query: string | undefined): string[];
//# sourceMappingURL=data.d.ts.map