export const PANEL_MODULE_REGISTRY = [
    { namespace: "custom-embeds", listField: "panels" },
    { namespace: "reaction-roles", listField: "panels" },
    { namespace: "tickets", listField: "ticketTypes" },
];
export const PANEL_MODULE_NAMESPACES = PANEL_MODULE_REGISTRY.map((entry) => entry.namespace);
export function panelListField(namespace) {
    return PANEL_MODULE_REGISTRY.find((entry) => entry.namespace === namespace)
        ?.listField;
}
//# sourceMappingURL=panelModuleRegistry.js.map