export function pluginToModule(plugin, values, enabled) {
    return {
        namespace: plugin.namespace,
        title: plugin.title,
        description: plugin.description,
        fields: plugin.fields,
        values,
        enabled,
    };
}
//# sourceMappingURL=context.js.map