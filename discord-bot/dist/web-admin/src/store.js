import { MAX_PANEL_OPTIONS, resolveFieldMaxLength, } from "#shared/core/limits.js";
import { assertSlugId, assertSnowflake, assertSnowflakesInArray, } from "#shared/core/discordIds.js";
import { slugify, toStringArray } from "#shared/core/strings.js";
import { setDbDataMany } from "#shared/core/dbData.js";
import { moduleTableName } from "#shared/core/moduleTable.js";
import { PANEL_MODULE_REGISTRY } from "#shared/core/panelModuleRegistry.js";
import { getModuleRowsSync } from "#shared/core/texts.js";
import { validateEmbedPanelRow } from "#shared/modules/custom-embeds/validate.js";
import { validateRolePanelRow } from "#shared/modules/reaction-roles/validate.js";
import { validateTicketTypeRow } from "#shared/modules/tickets/validate.js";
import { isBooleanField, isBooleanSubField, isMultiField, isMultiSubField, isObjectListField, isOptionListSubField, } from "./plugins.js";
const MAX_OPTION_LIST = MAX_PANEL_OPTIONS;
const PANEL_ROW_VALIDATORS = {
    "custom-embeds": {
        panels: validateEmbedPanelRow,
    },
    "reaction-roles": {
        panels: validateRolePanelRow,
    },
    tickets: {
        ticketTypes: validateTicketTypeRow,
    },
};
for (const { namespace, listField } of PANEL_MODULE_REGISTRY) {
    if (!PANEL_ROW_VALIDATORS[namespace]?.[listField]) {
        throw new Error(`[web-admin/store] Missing panel row validator for "${namespace}.${listField}".`);
    }
}
function runPanelRowValidator(namespace, fieldKey, configRow, textRow, itemLabel, fallbackMessage) {
    const validator = PANEL_ROW_VALIDATORS[namespace]?.[fieldKey];
    if (!validator)
        return;
    try {
        validator(configRow, textRow);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : fallbackMessage;
        throw new ValidationError(`${itemLabel}: ${message}`);
    }
}
function validateSlugId(id, label) {
    try {
        assertSlugId(id, label);
    }
    catch (err) {
        throw new ValidationError(err instanceof Error ? err.message : String(err));
    }
}
function validateSnowflake(value, label) {
    try {
        assertSnowflake(value, label);
    }
    catch (err) {
        throw new ValidationError(err instanceof Error ? err.message : String(err));
    }
}
function validateTextLength(value, label, maxLength = resolveFieldMaxLength()) {
    if (value.length > maxLength) {
        throw new ValidationError(`${label} must be at most ${maxLength} characters.`);
    }
}
function validateSnowflakesInArray(values, label) {
    try {
        assertSnowflakesInArray(values, label);
    }
    catch (err) {
        throw new ValidationError(err instanceof Error ? err.message : String(err));
    }
}
function validateDiscordIdField(type, normalized, label) {
    if (type === "channel" || type === "role") {
        validateSnowflake(normalized, label);
        return;
    }
    if (type === "channel-multi" || type === "role-multi") {
        validateSnowflakesInArray(normalized, label);
    }
}
function readModuleRows(namespace) {
    try {
        return getModuleRowsSync(namespace);
    }
    catch (err) {
        console.warn(`[web] Failed to read module "${namespace}" from database.`, err);
        throw new DataReadError(`Cannot read module "${namespace}" from the database. Run ./scripts/db/db-init.sh.`);
    }
}
export class DataReadError extends Error {
    constructor(message) {
        super(message);
        this.name = "DataReadError";
    }
}
function uniqueId(base, used) {
    let id = base;
    let n = 2;
    while (used.has(id)) {
        id = `${base}-${n}`;
        n += 1;
    }
    used.add(id);
    return id;
}
function isBlankValue(value) {
    if (value === undefined || value === null)
        return true;
    if (typeof value === "string")
        return value.trim() === "";
    if (Array.isArray(value))
        return value.length === 0;
    return false;
}
/** Keeps stored row values when the form POST omits or blanks unchanged fields. */
export function mergeObjectListRow(incoming, prev, itemFields) {
    if (!prev)
        return incoming;
    const merged = {
        ...prev,
        ...incoming,
        id: incoming.id ?? prev.id,
    };
    for (const sub of itemFields) {
        const formVal = incoming[sub.key];
        const prevVal = prev[sub.key];
        if (isBlankValue(formVal) && !isBlankValue(prevVal)) {
            merged[sub.key] = prevVal;
        }
    }
    return merged;
}
function isSubFieldVisible(sub, mergedRow) {
    if (!sub.visibleWhen)
        return true;
    for (const [watchKey, allowed] of Object.entries(sub.visibleWhen)) {
        const current = mergedRow[watchKey];
        if (typeof current !== "string" || !allowed.includes(current))
            return false;
    }
    return true;
}
function clearedSubValue(sub) {
    if (isMultiSubField(sub))
        return [];
    if (isBooleanSubField(sub))
        return false;
    if (isOptionListSubField(sub))
        return [];
    return "";
}
function applyClearWhenHidden(field, configRow, textRow) {
    const merged = { ...configRow, ...textRow };
    for (const sub of field.itemFields ?? []) {
        if (!sub.clearWhenHidden || !sub.visibleWhen)
            continue;
        if (isSubFieldVisible(sub, merged))
            continue;
        const cleared = clearedSubValue(sub);
        const store = sub.store ?? "config";
        if (store === "texts")
            textRow[sub.key] = cleared;
        else
            configRow[sub.key] = cleared;
    }
}
function readSubValue(sub, val) {
    if (isMultiSubField(sub))
        return toStringArray(val);
    if (isBooleanSubField(sub))
        return val === true;
    if (isOptionListSubField(sub)) {
        if (!Array.isArray(val))
            return [];
        return val.filter((v) => typeof v === "object" && v !== null);
    }
    return typeof val === "string" ? val : "";
}
function validateOptionList(sub, value, label) {
    if (!Array.isArray(value)) {
        throw new ValidationError(`${label}.${sub.key} must be an array of objects.`);
    }
    if (value.length > MAX_OPTION_LIST) {
        throw new ValidationError(`${label}.${sub.key} must have at most ${MAX_OPTION_LIST} entries.`);
    }
    const usedIds = new Set();
    const rows = [];
    for (const raw of value) {
        if (typeof raw !== "object" || raw === null) {
            throw new ValidationError(`Each entry in ${label}.${sub.key} must be an object.`);
        }
        const row = raw;
        const optionFields = sub.optionFields ?? [];
        let id = typeof row.id === "string" && row.id.trim() !== "" ? row.id.trim() : "";
        if (!id) {
            const labelKey = typeof row.label === "string" && row.label.trim() !== ""
                ? row.label
                : "option";
            id = uniqueId(slugify(labelKey), usedIds);
        }
        else {
            validateSlugId(id, `${label}.${sub.key}`);
            usedIds.add(id);
        }
        const normalized = { id };
        for (const optSub of optionFields) {
            const normalizedVal = validateSubValue(optSub, row[optSub.key], `${label}.${sub.key}[${id}]`);
            normalized[optSub.key] = normalizedVal;
        }
        rows.push(normalized);
    }
    return rows;
}
function validateSubValue(sub, value, label) {
    if (isMultiSubField(sub)) {
        if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
            throw new ValidationError(`${label}.${sub.key} must be an array of strings.`);
        }
        const normalized = value;
        if (sub.type === "channel-multi" || sub.type === "role-multi") {
            validateSnowflakesInArray(normalized, `${label}.${sub.key}`);
        }
        return normalized;
    }
    if (isBooleanSubField(sub)) {
        return value === true;
    }
    if (isOptionListSubField(sub)) {
        return validateOptionList(sub, value, label);
    }
    if (sub.type === "select") {
        if (typeof value !== "string") {
            throw new ValidationError(`${label}.${sub.key} must be a string.`);
        }
        if (sub.options?.length &&
            value &&
            !sub.options.some((o) => o.value === value)) {
            throw new ValidationError(`${label}.${sub.key} has an invalid selection.`);
        }
        return value;
    }
    if (typeof value !== "string") {
        throw new ValidationError(`${label}.${sub.key} must be a string.`);
    }
    if (sub.type === "text" || sub.type === "textarea") {
        validateTextLength(value, `${label}.${sub.key}`, resolveFieldMaxLength(sub.maxLength));
    }
    if (sub.type === "role" || sub.type === "channel") {
        validateSnowflake(value, `${label}.${sub.key}`);
    }
    return value;
}
function readObjectListValues(field, moduleData) {
    const rows = Array.isArray(moduleData[field.key])
        ? moduleData[field.key]
        : [];
    return rows
        .filter((row) => typeof row === "object" && row !== null)
        .map((row) => {
        const id = typeof row.id === "string" ? row.id : "";
        const merged = {
            id,
            published: row.published === true,
        };
        for (const sub of field.itemFields ?? []) {
            let val = readSubValue(sub, row[sub.key]);
            const store = sub.store ?? "config";
            if (store === "texts" &&
                isBlankValue(val) &&
                field.defaultItem?.[sub.key] !== undefined) {
                val = readSubValue(sub, field.defaultItem[sub.key]);
            }
            merged[sub.key] = val;
        }
        return merged;
    });
}
export function readEnabled(namespace) {
    return readModuleRows(namespace).enabled !== false;
}
export async function writeEnabled(namespace, enabled) {
    const table = moduleTableName(namespace);
    await setDbDataMany(table, { enabled });
    return enabled;
}
export function readValues(plugin) {
    const moduleData = readModuleRows(plugin.namespace);
    const values = {};
    for (const field of plugin.fields) {
        if (isObjectListField(field)) {
            values[field.key] = readObjectListValues(field, moduleData);
            continue;
        }
        const current = moduleData[field.key];
        if (isMultiField(field)) {
            values[field.key] = toStringArray(current);
        }
        else if (isBooleanField(field)) {
            values[field.key] = current === true;
        }
        else {
            values[field.key] = typeof current === "string" ? current : "";
        }
    }
    return values;
}
export class ValidationError extends Error {
}
export async function writeValues(plugin, input) {
    if (typeof input !== "object" || input === null) {
        throw new ValidationError("Request body must be a JSON object of field values.");
    }
    const fieldsByKey = new Map(plugin.fields.map((f) => [f.key, f]));
    const incoming = input;
    const moduleExisting = readModuleRows(plugin.namespace);
    const patch = {};
    for (const [key, value] of Object.entries(incoming)) {
        const field = fieldsByKey.get(key);
        if (!field) {
            throw new ValidationError(`Unknown field "${key}" for module "${plugin.namespace}".`);
        }
        if (isObjectListField(field)) {
            if (!Array.isArray(value)) {
                throw new ValidationError(`Field "${key}" must be an array of objects.`);
            }
            const existingRows = Array.isArray(moduleExisting[field.key])
                ? moduleExisting[field.key]
                : [];
            const existingById = new Map(existingRows
                .filter((r) => typeof r.id === "string")
                .map((r) => [r.id, r]));
            const usedIds = new Set();
            const mergedRows = [];
            for (const rawRow of value) {
                if (typeof rawRow !== "object" || rawRow === null) {
                    throw new ValidationError(`Each entry in "${key}" must be an object.`);
                }
                const row = rawRow;
                let id = typeof row.id === "string" && row.id.trim() !== ""
                    ? row.id.trim()
                    : "";
                if (!id) {
                    const label = typeof row.panelTitle === "string" && row.panelTitle.trim() !== ""
                        ? row.panelTitle
                        : typeof row.openButtonLabel === "string" &&
                            row.openButtonLabel.trim() !== ""
                            ? row.openButtonLabel
                            : (field.itemLabel ?? "item");
                    id = uniqueId(slugify(label), usedIds);
                }
                else {
                    validateSlugId(id, `${key}[${id}]`);
                    usedIds.add(id);
                }
                const prev = existingById.get(id);
                const itemFields = field.itemFields ?? [];
                const mergedRow = mergeObjectListRow(row, prev, itemFields);
                const configRow = {
                    id,
                    published: prev?.published === true,
                    panelMessageId: typeof prev?.panelMessageId === "string" ? prev.panelMessageId : "",
                };
                const textRow = {};
                for (const sub of itemFields) {
                    const normalized = validateSubValue(sub, mergedRow[sub.key], `${key}[${id}]`);
                    const store = sub.store ?? "config";
                    if (store === "texts")
                        textRow[sub.key] = normalized;
                    else
                        configRow[sub.key] = normalized;
                }
                applyClearWhenHidden(field, configRow, textRow);
                runPanelRowValidator(plugin.namespace, field.key, configRow, textRow, `${key}[${id}]`, "Invalid panel configuration.");
                mergedRows.push({ ...configRow, ...textRow });
            }
            patch[field.key] = mergedRows;
            continue;
        }
        let normalized;
        if (isMultiField(field)) {
            if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
                throw new ValidationError(`Field "${key}" must be an array of strings.`);
            }
            normalized = value;
        }
        else if (isBooleanField(field)) {
            if (typeof value !== "boolean") {
                throw new ValidationError(`Field "${key}" must be a boolean.`);
            }
            normalized = value;
        }
        else {
            if (typeof value !== "string") {
                throw new ValidationError(`Field "${key}" must be a string.`);
            }
            if (field.type === "text" || field.type === "textarea") {
                validateTextLength(value, `Field "${key}"`, resolveFieldMaxLength(field.maxLength));
            }
            normalized = value;
        }
        validateDiscordIdField(field.type, normalized, `Field "${key}"`);
        patch[field.key] = normalized;
    }
    if (Object.keys(patch).length > 0) {
        await setDbDataMany(moduleTableName(plugin.namespace), patch);
    }
    return readValues(plugin);
}
//# sourceMappingURL=store.js.map