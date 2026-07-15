import { getModuleDataSync } from "./texts.js";
import { moduleTableName } from "./moduleTable.js";
/** Merges config + text defaults for DB seeding and store fallbacks. */
export function moduleDefaultsFromParts(configDefaults, textDefaults) {
    return { ...configDefaults, ...textDefaults };
}
export function createModuleData(namespace, moduleDefaults) {
    return {
        NAMESPACE: namespace,
        MODULE_DEFAULTS: moduleDefaults,
        table: moduleTableName(namespace),
        data() {
            return getModuleDataSync(namespace, moduleDefaults);
        },
        get(key) {
            const all = getModuleDataSync(namespace, moduleDefaults);
            return all[key];
        },
    };
}
/** Wires namespace + defaults for simple (non-panel) modules. */
export function defineSimpleModule(opts) {
    const MODULE_DEFAULTS = moduleDefaultsFromParts(opts.configDefaults, opts.textDefaults);
    const mod = createModuleData(opts.namespace, MODULE_DEFAULTS);
    return {
        CONFIG_DEFAULTS: opts.configDefaults,
        TEXT_DEFAULTS: opts.textDefaults,
        MODULE_DEFAULTS,
        NAMESPACE: mod.NAMESPACE,
        get: mod.get,
        data: mod.data,
        table: mod.table,
    };
}
/** Non-empty trimmed string from a config/text value, or undefined when unset. */
export function optionalConfigString(value) {
    const id = typeof value === "string" ? value.trim() : "";
    return id === "" ? undefined : id;
}
/** Resolves a list row by id with default texts and module-specific normalization. */
export function createListResolver(opts) {
    return (id) => {
        const row = findListItemById(opts.get(opts.listKey), id);
        if (!row)
            return undefined;
        return opts.normalize(row);
    };
}
/** Finds a merged list row by id (panel/ticket modules). */
export function findListItemById(list, id) {
    if (!Array.isArray(list))
        return undefined;
    return list.find((item) => item.id === id);
}
//# sourceMappingURL=moduleConfig.js.map