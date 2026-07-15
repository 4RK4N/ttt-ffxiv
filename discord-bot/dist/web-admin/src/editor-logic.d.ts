import type { WebPluginField, WebPluginSubField } from "./plugin-types.js";
export interface SubFieldReader {
    key: string;
    getValue: () => unknown;
}
/** Collect live values from object-list row sub-fields. */
export declare function liveRowValues(subFields: SubFieldReader[], item: Record<string, unknown>, f?: Pick<WebPluginField, "itemLabel">): Record<string, unknown>;
/** Whether a sub-field should show given sibling values and visibleWhen rules. */
export declare function isFieldVisible(def: Pick<WebPluginSubField, "visibleWhen">, subFields: SubFieldReader[]): boolean;
//# sourceMappingURL=editor-logic.d.ts.map