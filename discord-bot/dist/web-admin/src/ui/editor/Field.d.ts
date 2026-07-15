import type { WebPluginField } from "../../plugin-types.js";
import type { EditorContext } from "./context.js";
import { type SubFieldProps } from "./fields/shared.js";
export declare function SubField(props: SubFieldProps & Record<string, unknown>): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function Field({ f, value, ctx, namespace, expanded, }: {
    f: WebPluginField;
    value: unknown;
    ctx: EditorContext;
    namespace: string;
    expanded?: string[];
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function RowSubFieldsWithWatch({ field, row, rowIndex, ctx, namespace, expanded, }: {
    field: WebPluginField;
    row: Record<string, unknown>;
    rowIndex: number;
    ctx: EditorContext;
    namespace: string;
    expanded?: string[];
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export { ObjectListRow } from "./fields/ObjectListField.js";
//# sourceMappingURL=Field.d.ts.map