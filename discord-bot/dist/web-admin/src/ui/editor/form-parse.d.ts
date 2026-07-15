import type { WebPlugin } from "../../plugin-types.js";
type FormBody = Record<string, string | string[] | File>;
/** Parse bracket keys like `panels[0].channelId` into nested objects/arrays. */
export declare function parseBracketForm(body: FormBody): Record<string, unknown>;
/** Convert HTMX form body to the JSON shape expected by writeValues. */
export declare function formBodyToValues(plugin: WebPlugin, body: FormBody): Record<string, unknown>;
export {};
//# sourceMappingURL=form-parse.d.ts.map