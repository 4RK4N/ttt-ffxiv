import type { WebPluginSubField } from "../../../plugin-types.js";
import type { EditorContext } from "../context.js";
export declare function OptionListField({ f, value, name, ctx, namespace, fieldKey, rowIndex, disabled, }: {
    f: WebPluginSubField;
    value: unknown;
    name: string;
    ctx: EditorContext;
    namespace: string;
    fieldKey: string;
    rowIndex: number;
    disabled?: boolean;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
export declare function OptionListRowsOnly({ f, name, items, ctx, namespace, fieldKey, rowIndex, disabled, }: {
    f: WebPluginSubField;
    name: string;
    items: Record<string, unknown>[];
    ctx: EditorContext;
    namespace: string;
    fieldKey: string;
    rowIndex: number;
    disabled?: boolean;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
//# sourceMappingURL=OptionListField.d.ts.map