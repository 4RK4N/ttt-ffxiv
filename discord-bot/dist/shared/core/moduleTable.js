export const MODULE_NAMESPACES = [
    "welcome-message",
    "pic-repost-commands",
    "links-pics-vids-autothread",
    "tickets",
    "reaction-roles",
    "custom-embeds",
    "moderation-log",
    "emojis",
];
export const APP_CONFIG_TABLE = "app_config";
export function moduleTableName(namespace) {
    if (!MODULE_NAMESPACES.includes(namespace)) {
        throw new Error(`Unknown module namespace "${namespace}".`);
    }
    return `module_${namespace.replace(/-/g, "_")}`;
}
export function namespaceFromTable(table) {
    if (!table.startsWith("module_"))
        return undefined;
    const slug = table.slice("module_".length).replace(/_/g, "-");
    if (!MODULE_NAMESPACES.includes(slug)) {
        return undefined;
    }
    return slug;
}
export function assertSafeTableName(table) {
    if (table === APP_CONFIG_TABLE)
        return;
    if (!table.startsWith("module_")) {
        throw new Error(`Invalid table name "${table}".`);
    }
    const slug = table.slice("module_".length).replace(/_/g, "-");
    if (!MODULE_NAMESPACES.includes(slug)) {
        throw new Error(`Unknown module table "${table}".`);
    }
}
//# sourceMappingURL=moduleTable.js.map