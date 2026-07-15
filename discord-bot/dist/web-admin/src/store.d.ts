import type { WebPlugin, WebPluginSubField } from "./plugins.js";
export type FieldValue = string | string[] | boolean | Record<string, unknown>[];
export declare class DataReadError extends Error {
    constructor(message: string);
}
/** Keeps stored row values when the form POST omits or blanks unchanged fields. */
export declare function mergeObjectListRow(incoming: Record<string, unknown>, prev: Record<string, unknown> | undefined, itemFields: WebPluginSubField[]): Record<string, unknown>;
export declare function readEnabled(namespace: string): boolean;
export declare function writeEnabled(namespace: string, enabled: boolean): Promise<boolean>;
export declare function readValues(plugin: WebPlugin): Record<string, FieldValue>;
export declare class ValidationError extends Error {
}
export declare function writeValues(plugin: WebPlugin, input: unknown): Promise<Record<string, FieldValue>>;
//# sourceMappingURL=store.d.ts.map