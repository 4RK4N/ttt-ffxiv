export type WebFieldType = "text" | "textarea" | "channel" | "channel-multi" | "role" | "role-multi" | "boolean" | "select" | "option-list" | "object-list";
export type WebFieldStore = "texts" | "config";
export interface WebPluginSelectOption {
    value: string;
    label: string;
}
export type WebPluginVisibleWhen = Record<string, string[]>;
export interface WebPluginSubField {
    key: string;
    label: string;
    type: Exclude<WebFieldType, "object-list">;
    store?: WebFieldStore;
    help?: string;
    /** Max string length; defaults to Discord plain message limit (2000). */
    maxLength?: number;
    options?: WebPluginSelectOption[];
    optionFields?: WebPluginSubField[];
    visibleWhen?: WebPluginVisibleWhen;
    clearWhenHidden?: boolean;
}
export interface WebPluginField {
    key: string;
    label: string;
    type: WebFieldType;
    store: WebFieldStore;
    help?: string;
    /** Max string length for text/textarea; defaults to Discord plain message limit (2000). */
    maxLength?: number;
    itemLabel?: string;
    publishable?: boolean;
    collapsible?: boolean;
    itemFields?: WebPluginSubField[];
    optionFields?: WebPluginSubField[];
    defaultItem?: Record<string, unknown>;
}
export interface WebPlugin {
    namespace: string;
    title: string;
    description?: string;
    fields: WebPluginField[];
}
/** Module payload from GET /api/modules. */
export interface EditorModule {
    namespace: string;
    title: string;
    description?: string;
    fields: WebPluginField[];
    values: Record<string, unknown>;
    enabled?: boolean;
}
export interface GuildChannel {
    id: string;
    name: string;
}
export interface GuildRole {
    id: string;
    name: string;
}
export interface FieldControl {
    node: HTMLElement;
    getValue: () => unknown;
    input?: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    applySavedValues?: (rows: unknown[]) => void;
}
export interface SubFieldBinding {
    key: string;
    getValue: () => unknown;
    node?: HTMLElement;
    def?: WebPluginSubField;
}
//# sourceMappingURL=plugin-types.d.ts.map