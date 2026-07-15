/** Panel modules that support web-editor publish and row validation. */
export interface PanelModuleRegistryEntry {
    namespace: string;
    listField: string;
}
export declare const PANEL_MODULE_REGISTRY: readonly [{
    readonly namespace: "custom-embeds";
    readonly listField: "panels";
}, {
    readonly namespace: "reaction-roles";
    readonly listField: "panels";
}, {
    readonly namespace: "tickets";
    readonly listField: "ticketTypes";
}];
export type PanelModuleNamespace = (typeof PANEL_MODULE_REGISTRY)[number]["namespace"];
export declare const PANEL_MODULE_NAMESPACES: PanelModuleNamespace[];
export declare function panelListField(namespace: string): string | undefined;
//# sourceMappingURL=panelModuleRegistry.d.ts.map