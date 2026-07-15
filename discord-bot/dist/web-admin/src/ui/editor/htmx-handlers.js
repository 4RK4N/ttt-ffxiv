import { formBodyToValues } from "./form-parse.js";
export function getObjectListItems(plugin, body, fieldKey) {
    const values = formBodyToValues(plugin, body);
    const raw = values[fieldKey];
    return Array.isArray(raw) ? raw : [];
}
export function findObjectListField(plugin, fieldKey) {
    const field = plugin.fields.find((f) => f.key === fieldKey);
    if (!field || field.type !== "object-list")
        return null;
    return field;
}
export function toggleExpanded(expanded, key) {
    const set = new Set(expanded);
    if (set.has(key))
        set.delete(key);
    else
        set.add(key);
    return [...set];
}
function rowKey(item, index) {
    const id = item.id;
    return id && String(id).trim() ? String(id).trim() : `__idx__${index}`;
}
export function rowKeyForItem(item, index) {
    return rowKey(item, index);
}
export function mergeRowFromForm(plugin, body, fieldKey, rowIndex) {
    const items = getObjectListItems(plugin, body, fieldKey);
    return items[rowIndex] ?? {};
}
export function getOptionListItems(row, optionKey) {
    const raw = row[optionKey];
    return Array.isArray(raw) ? raw : [];
}
export function defaultOptionItem() {
    return { id: "", roleId: "", emoji: "", label: "" };
}
export function defaultObjectItem(field) {
    return structuredClone(field.defaultItem ?? { id: "", published: false });
}
//# sourceMappingURL=htmx-handlers.js.map