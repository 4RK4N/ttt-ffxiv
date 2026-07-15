import { isFieldVisible } from "../../editor-logic.js";
function setNestedArray(obj, path, value) {
    const segments = path.split(".");
    let cur = obj;
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const indexMatch = seg.match(/^(.+)\[(\d+)\]$/);
        const isLast = i === segments.length - 1;
        if (indexMatch) {
            const [, key, idxStr] = indexMatch;
            const idx = Number(idxStr);
            const parent = cur;
            if (!Array.isArray(parent[key]))
                parent[key] = [];
            const arr = parent[key];
            if (isLast) {
                if (!Array.isArray(arr[idx]))
                    arr[idx] = [];
                arr[idx].push(value);
                return;
            }
            if (arr[idx] == null || typeof arr[idx] !== "object")
                arr[idx] = {};
            cur = arr[idx];
            continue;
        }
        if (isLast) {
            const parent = cur;
            if (!Array.isArray(parent[seg]))
                parent[seg] = [];
            parent[seg].push(value);
            return;
        }
        const parent = cur;
        if (parent[seg] == null || typeof parent[seg] !== "object")
            parent[seg] = {};
        cur = parent[seg];
    }
}
function appendFormValue(root, key, raw) {
    if (key.endsWith("[]")) {
        setNestedArray(root, key.slice(0, -2), raw);
        return;
    }
    const parts = key.match(/[^[\].]+|\[\d+\]/g);
    if (!parts?.length)
        return;
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const indexMatch = part.match(/^\[(\d+)\]$/);
        if (indexMatch) {
            const idx = Number(indexMatch[1]);
            if (!Array.isArray(cur))
                return;
            if (isLast) {
                cur[idx] = raw;
            }
            else {
                if (cur[idx] == null || typeof cur[idx] !== "object") {
                    cur[idx] = /^\[\d+\]$/.test(parts[i + 1] ?? "") ? [] : {};
                }
                cur = cur[idx];
            }
            continue;
        }
        if (isLast) {
            cur[part] = raw;
        }
        else {
            const nextIsIndex = /^\[\d+\]$/.test(parts[i + 1] ?? "");
            const parent = cur;
            if (parent[part] == null || typeof parent[part] !== "object") {
                parent[part] = nextIsIndex ? [] : {};
            }
            cur = parent[part];
        }
    }
}
/** Parse bracket keys like `panels[0].channelId` into nested objects/arrays. */
export function parseBracketForm(body) {
    const root = {};
    for (const [key, raw] of Object.entries(body)) {
        if (raw instanceof File)
            continue;
        if (Array.isArray(raw)) {
            for (const v of raw) {
                if (typeof v === "string")
                    appendFormValue(root, key, v);
            }
            continue;
        }
        if (typeof raw !== "string")
            continue;
        if (key === "_csrf")
            continue;
        appendFormValue(root, key, raw);
    }
    return root;
}
function parseScalarField(f, tree) {
    const raw = tree[f.key];
    if (f.type === "boolean") {
        if (raw === undefined || raw === "" || raw === "false")
            return false;
        return raw === "true" || raw === "on" || raw === true;
    }
    if (f.type === "channel-multi" || f.type === "role-multi") {
        if (Array.isArray(raw))
            return raw.filter((v) => typeof v === "string");
        if (typeof raw === "string" && raw !== "")
            return [raw];
        return [];
    }
    if (f.type === "option-list") {
        return parseOptionList(f, raw);
    }
    if (typeof raw === "string")
        return raw;
    return "";
}
function parseOptionList(f, raw) {
    if (!Array.isArray(raw))
        return [];
    const rows = [];
    for (const entry of raw) {
        if (typeof entry !== "object" || entry === null)
            continue;
        const row = entry;
        const out = {};
        if (typeof row.id === "string")
            out.id = row.id;
        for (const sub of f.optionFields ?? []) {
            out[sub.key] = parseScalarField(sub, row);
        }
        rows.push(out);
    }
    return rows;
}
function parseObjectListRow(field, raw) {
    if (typeof raw !== "object" || raw === null)
        return {};
    const row = raw;
    const out = {};
    if (typeof row.id === "string")
        out.id = row.id;
    if (row.published === true || row.published === "true")
        out.published = true;
    const subReaders = (field.itemFields ?? []).map((sub) => ({
        key: sub.key,
        getValue: () => parseScalarField(sub, row),
        def: sub,
    }));
    for (const sub of field.itemFields ?? []) {
        const visible = isFieldVisible(sub, subReaders);
        if (!visible && sub.clearWhenHidden) {
            if (sub.type === "boolean")
                out[sub.key] = false;
            else if (sub.type === "channel-multi" || sub.type === "role-multi")
                out[sub.key] = [];
            else if (sub.type === "option-list")
                out[sub.key] = [];
            else
                out[sub.key] = "";
        }
        else {
            out[sub.key] = parseScalarField(sub, row);
        }
    }
    return out;
}
/** Convert HTMX form body to the JSON shape expected by writeValues. */
export function formBodyToValues(plugin, body) {
    const tree = parseBracketForm(body);
    const out = {};
    for (const f of plugin.fields) {
        if (f.type === "object-list") {
            const raw = tree[f.key];
            if (!Array.isArray(raw)) {
                out[f.key] = [];
                continue;
            }
            out[f.key] = raw.map((row) => parseObjectListRow(f, row));
            continue;
        }
        out[f.key] = parseScalarField(f, tree);
    }
    return out;
}
//# sourceMappingURL=form-parse.js.map