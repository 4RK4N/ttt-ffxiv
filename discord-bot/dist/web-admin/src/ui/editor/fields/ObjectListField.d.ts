import type { WebPluginField } from "../../../plugin-types.js";
import type { EditorContext } from "../context.js";
export declare function ObjectListRow({ field, row, rowIndex, ctx, namespace, expanded, }: {
    field: WebPluginField;
    row: Record<string, unknown>;
    rowIndex: number;
    ctx: EditorContext;
    namespace: string;
    expanded?: string[];
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function ObjectListField({ f, value, ctx, namespace, expanded, }: {
    f: WebPluginField;
    value: unknown;
    ctx: EditorContext;
    namespace: string;
    expanded?: string[];
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function ObjectListRowsOnly({ field, items, ctx, namespace, expanded, }: {
    field: WebPluginField;
    items: Record<string, unknown>[];
    ctx: EditorContext;
    namespace: string;
    expanded?: string[];
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
//# sourceMappingURL=ObjectListField.d.ts.map