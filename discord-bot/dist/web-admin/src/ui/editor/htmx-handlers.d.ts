import type { WebPlugin, WebPluginField } from "../../plugin-types.js";
type FormBody = Record<string, string | File>;
export declare function getObjectListItems(plugin: WebPlugin, body: FormBody, fieldKey: string): Record<string, unknown>[];
export declare function findObjectListField(plugin: WebPlugin, fieldKey: string): WebPluginField | null;
export declare function toggleExpanded(expanded: string[], key: string): string[];
export declare function rowKeyForItem(item: Record<string, unknown>, index: number): string;
export declare function mergeRowFromForm(plugin: WebPlugin, body: FormBody, fieldKey: string, rowIndex: number): Record<string, unknown>;
export declare function getOptionListItems(row: Record<string, unknown>, optionKey: string): Record<string, unknown>[];
export declare function defaultOptionItem(): Record<string, unknown>;
export declare function defaultObjectItem(field: WebPluginField): Record<string, unknown>;
export {};
//# sourceMappingURL=htmx-handlers.d.ts.map