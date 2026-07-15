import { MODULE_NAMESPACES, moduleTableName, } from "#shared/core/moduleTable.js";
import { getDbData } from "#shared/core/dbData.js";
const VALID_SCALAR_TYPES = [
    "text",
    "textarea",
    "channel",
    "channel-multi",
    "role",
    "role-multi",
    "boolean",
    "select",
    "option-list",
];
const VALID_TYPES = [...VALID_SCALAR_TYPES, "object-list"];
const VALID_STORES = ["texts", "config"];
function parseVisibleWhen(raw) {
    if (typeof raw !== "object" || raw === null)
        return undefined;
    const out = {};
    for (const [key, values] of Object.entries(raw)) {
        if (!Array.isArray(values))
            continue;
        const allowed = values.filter((v) => typeof v === "string");
        if (allowed.length > 0)
            out[key] = allowed;
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
function parseDefaultItem(raw) {
    if (typeof raw !== "object" || raw === null || Array.isArray(raw))
        return undefined;
    return raw;
}
function parseSelectOptions(raw) {
    if (!Array.isArray(raw))
        return undefined;
    const options = [];
    for (const entry of raw) {
        if (typeof entry !== "object" || entry === null)
            continue;
        const o = entry;
        if (typeof o.value !== "string" || typeof o.label !== "string")
            continue;
        options.push({ value: o.value, label: o.label });
    }
    return options.length > 0 ? options : undefined;
}
function parseMaxLength(raw) {
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw <= 0) {
        return undefined;
    }
    return Math.floor(raw);
}
function parseSubField(entry) {
    if (typeof entry !== "object" || entry === null)
        return null;
    const f = entry;
    if (typeof f.key !== "string" || f.key.trim() === "")
        return null;
    const type = typeof f.type === "string" &&
        VALID_SCALAR_TYPES.includes(f.type)
        ? f.type
        : "text";
    const store = typeof f.store === "string" && VALID_STORES.includes(f.store)
        ? f.store
        : "config";
    const optionFields = [];
    if (type === "option-list" && Array.isArray(f.optionFields)) {
        for (const sub of f.optionFields) {
            const parsed = parseSubField(sub);
            if (parsed)
                optionFields.push(parsed);
        }
    }
    const maxLength = parseMaxLength(f.maxLength);
    return {
        key: f.key,
        label: typeof f.label === "string" && f.label.trim() !== "" ? f.label : f.key,
        type,
        store,
        help: typeof f.help === "string" ? f.help : undefined,
        maxLength,
        options: parseSelectOptions(f.options),
        optionFields: optionFields.length > 0 ? optionFields : undefined,
        visibleWhen: parseVisibleWhen(f.visibleWhen),
        clearWhenHidden: f.clearWhenHidden === true,
    };
}
function parsePlugin(namespace, raw) {
    if (typeof raw !== "object" || raw === null) {
        console.warn(`[web/plugins] "${namespace}" editorConfig is not an object; skipping.`);
        return null;
    }
    const obj = raw;
    const title = typeof obj.title === "string" && obj.title.trim() !== ""
        ? obj.title
        : namespace;
    const description = typeof obj.description === "string" ? obj.description : undefined;
    if (!Array.isArray(obj.fields)) {
        console.warn(`[web/plugins] "${namespace}" editorConfig has no fields array; skipping.`);
        return null;
    }
    const fields = [];
    for (const entry of obj.fields) {
        if (typeof entry !== "object" || entry === null)
            continue;
        const f = entry;
        if (typeof f.key !== "string" || f.key.trim() === "") {
            console.warn(`[web/plugins] "${namespace}" has a field without a valid "key"; skipping field.`);
            continue;
        }
        const type = typeof f.type === "string" && VALID_TYPES.includes(f.type)
            ? f.type
            : "text";
        const store = typeof f.store === "string" &&
            VALID_STORES.includes(f.store)
            ? f.store
            : "texts";
        const itemFields = [];
        if (type === "object-list" && Array.isArray(f.itemFields)) {
            for (const sub of f.itemFields) {
                const parsed = parseSubField(sub);
                if (parsed)
                    itemFields.push(parsed);
            }
        }
        const maxLength = parseMaxLength(f.maxLength);
        fields.push({
            key: f.key,
            label: typeof f.label === "string" && f.label.trim() !== "" ? f.label : f.key,
            type,
            store,
            help: typeof f.help === "string" ? f.help : undefined,
            maxLength,
            itemLabel: typeof f.itemLabel === "string" ? f.itemLabel : "Item",
            publishable: f.publishable === true,
            collapsible: f.collapsible === true,
            itemFields: itemFields.length > 0 ? itemFields : undefined,
            defaultItem: parseDefaultItem(f.defaultItem),
        });
    }
    if (fields.length === 0) {
        console.warn(`[web/plugins] "${namespace}" editorConfig has no valid fields; skipping.`);
        return null;
    }
    return { namespace, title, description, fields };
}
export async function loadWebPlugins() {
    const plugins = [];
    for (const namespace of MODULE_NAMESPACES) {
        const table = moduleTableName(namespace);
        try {
            const raw = await getDbData(table, "editorConfig");
            if (raw == null)
                continue;
            const plugin = parsePlugin(namespace, raw);
            if (plugin) {
                plugins.push(plugin);
                console.log(`[web/plugins] Loaded web plugin "${plugin.title}" (${namespace}).`);
            }
        }
        catch (err) {
            console.warn(`[web/plugins] Failed to read editorConfig for "${namespace}"; skipping.`, err);
        }
    }
    plugins.sort((a, b) => a.title.localeCompare(b.title));
    return plugins;
}
export function isMultiSubField(field) {
    return field.type === "channel-multi" || field.type === "role-multi";
}
export function isObjectListField(field) {
    return field.type === "object-list";
}
export function isMultiField(field) {
    return field.type === "channel-multi" || field.type === "role-multi";
}
export function isOptionListSubField(field) {
    return field.type === "option-list";
}
export function isBooleanField(field) {
    return field.type === "boolean";
}
export function isBooleanSubField(field) {
    return field.type === "boolean";
}
export function hasPublishableField(plugin) {
    return plugin.fields.some((f) => isObjectListField(f) && f.publishable === true);
}
//# sourceMappingURL=plugins.js.map