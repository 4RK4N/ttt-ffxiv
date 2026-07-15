import type { WebPlugin, WebPluginField, WebPluginSubField } from "./plugin-types.js";
export type { WebFieldType, WebFieldStore, WebPluginSelectOption, WebPluginVisibleWhen, WebPluginSubField, WebPluginField, WebPlugin, } from "./plugin-types.js";
export declare function loadWebPlugins(): Promise<WebPlugin[]>;
export declare function isMultiSubField(field: WebPluginSubField): boolean;
export declare function isObjectListField(field: WebPluginField): boolean;
export declare function isMultiField(field: WebPluginField): boolean;
export declare function isOptionListSubField(field: WebPluginSubField): boolean;
export declare function isBooleanField(field: WebPluginField): boolean;
export declare function isBooleanSubField(field: WebPluginSubField): boolean;
export declare function hasPublishableField(plugin: WebPlugin): boolean;
//# sourceMappingURL=plugins.d.ts.map