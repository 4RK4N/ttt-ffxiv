import type { Context } from "hono";
import type { WebConfig } from "../../config.js";
import type { WebPlugin } from "../../plugin-types.js";
import type { AppEnv } from "../../env.js";
type Env = AppEnv;
type HonoCtx = Context<Env>;
export interface HtmxDeps {
    cfg: WebConfig;
    byNamespace: Map<string, WebPlugin>;
}
export declare function renderPanel(c: HonoCtx, deps: HtmxDeps, namespace: string, expanded: string[], status?: {
    ok: boolean;
    message: string;
}): Promise<Response>;
export declare function registerHtmxRoutes(htmx: import("hono").Hono<Env>, deps: HtmxDeps): void;
export {};
//# sourceMappingURL=routes.d.ts.map