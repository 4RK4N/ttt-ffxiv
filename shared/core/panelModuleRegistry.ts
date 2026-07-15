/** Panel modules that support web-editor publish and row validation. */
export interface PanelModuleRegistryEntry {
  namespace: string;
  listField: string;
}

export const PANEL_MODULE_REGISTRY = [
  { namespace: "custom-embeds", listField: "panels" },
  { namespace: "reaction-roles", listField: "panels" },
  { namespace: "tickets", listField: "ticketTypes" },
] as const satisfies readonly PanelModuleRegistryEntry[];

export type PanelModuleNamespace =
  (typeof PANEL_MODULE_REGISTRY)[number]["namespace"];

export const PANEL_MODULE_NAMESPACES: PanelModuleNamespace[] =
  PANEL_MODULE_REGISTRY.map((entry) => entry.namespace);

export function panelListField(namespace: string): string | undefined {
  return PANEL_MODULE_REGISTRY.find((entry) => entry.namespace === namespace)
    ?.listField;
}
