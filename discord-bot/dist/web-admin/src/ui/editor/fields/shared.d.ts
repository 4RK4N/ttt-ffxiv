import type { WebPluginSubField } from "../../../plugin-types.js";
import type { EditorContext } from "../context.js";
export interface SubFieldProps {
    f: WebPluginSubField;
    value: unknown;
    ctx: EditorContext;
    name: string;
    disabled?: boolean;
}
export interface TopFieldProps {
    f: import("../../../plugin-types.js").WebPluginField;
    value: unknown;
    ctx: EditorContext;
    namespace: string;
    expanded?: string[];
}
export declare function fieldValueStr(value: unknown): string;
/** HTML maxLength for text/textarea; uses plugin config when set. */
export declare function textInputMaxLength(f: Pick<WebPluginSubField, "maxLength">): number;
export declare function Help({ text }: {
    text?: string;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element | null;
export declare function FieldWrap({ id, label, help, children, disabled, }: {
    id: string;
    label: string;
    help?: string;
    children: unknown;
    disabled?: boolean;
}): import("hono/jsx/jsx-dev-runtime").JSX.Element;
//# sourceMappingURL=shared.d.ts.map