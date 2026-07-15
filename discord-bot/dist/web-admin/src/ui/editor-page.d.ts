import type { SessionUser } from "../auth.js";
import type { WebPlugin } from "../plugin-types.js";
import type { WebConfig } from "../config.js";
export declare function EditorPage({ cfg, user, csrfToken, cspNonce, plugins, activeNamespace, }: {
    cfg: WebConfig;
    user: SessionUser;
    csrfToken: string;
    cspNonce: string;
    plugins: WebPlugin[];
    activeNamespace?: string;
}): Promise<import("hono/utils/html").HtmlEscapedString>;
//# sourceMappingURL=editor-page.d.ts.map