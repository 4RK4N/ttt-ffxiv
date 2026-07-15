import { slugify } from "#shared/core/strings.js";
/** Collect live values from object-list row sub-fields. */
export function liveRowValues(subFields, item, f) {
    const out = { id: item.id || "" };
    for (const sf of subFields) {
        out[sf.key] = sf.getValue();
    }
    if (!out.id) {
        out.id = slugify(String(out.openButtonLabel ?? out.panelTitle ?? f?.itemLabel ?? "item"));
    }
    return out;
}
/** Whether a sub-field should show given sibling values and visibleWhen rules. */
export function isFieldVisible(def, subFields) {
    if (!def.visibleWhen)
        return true;
    for (const watchKey of Object.keys(def.visibleWhen)) {
        const allowed = def.visibleWhen[watchKey];
        const watchSf = subFields.find((s) => s.key === watchKey);
        const current = watchSf ? String(watchSf.getValue() ?? "") : "";
        if (!allowed.includes(current))
            return false;
    }
    return true;
}
//# sourceMappingURL=editor-logic.js.map