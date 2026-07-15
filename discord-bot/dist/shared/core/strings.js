/** Coerces an unknown value to a string array (non-strings dropped). */
export function toStringArray(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((v) => typeof v === "string");
}
/** Lowercase slug for panel/item ids (max 32 chars). */
export function slugify(value) {
    return (value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 32) || "item");
}
//# sourceMappingURL=strings.js.map