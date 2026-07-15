import path from "node:path";
import { resolveDataDir } from "./dataDir.js";
import { RESERVED_MODULE_KEYS } from "./dbData.js";
import { getDbDataAll } from "./dbData.js";
import { moduleTableName } from "./moduleTable.js";
const DATA_DIR = resolveDataDir();
/** Resolves a path inside a module's data folder: data/<namespace>/<segments>. */
export function moduleDataPath(namespace, ...segments) {
    assertSafePathSegment(namespace, "namespace");
    for (const segment of segments) {
        assertSafePathSegment(segment, "path segment");
    }
    const dataRoot = path.resolve(DATA_DIR);
    const resolved = path.resolve(dataRoot, namespace, ...segments);
    if (resolved !== dataRoot && !resolved.startsWith(`${dataRoot}${path.sep}`)) {
        throw new Error("Path escapes data directory.");
    }
    return resolved;
}
function assertSafePathSegment(segment, label) {
    if (!segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("\0") ||
        segment.includes("/") ||
        segment.includes("\\")) {
        throw new Error(`Invalid ${label}.`);
    }
}
/**
 * Replaces `{token}` placeholders in a template with the provided values.
 * Unknown tokens are left untouched.
 */
export function format(template, vars) {
    return template.replace(/\{(\w+)\}/g, (match, key) => key in vars ? String(vars[key]) : match);
}
const moduleStore = new Map();
function merge(defaults, overrides) {
    return { ...defaults, ...overrides };
}
function cachedData(defaults, rows) {
    return merge(defaults, rows);
}
function runtimeRows(rows) {
    const out = {};
    for (const [key, value] of Object.entries(rows)) {
        if (RESERVED_MODULE_KEYS.has(key))
            continue;
        out[key] = value;
    }
    return out;
}
export function getModuleRowsSync(namespace) {
    const cached = moduleStore.get(namespace);
    if (!cached) {
        throw new Error(`Module "${namespace}" store is cold. Call reloadModuleStore() during startup.`);
    }
    return { ...cached };
}
export function getModuleDataSync(namespace, defaults) {
    const cached = moduleStore.get(namespace);
    if (cached) {
        return cachedData(defaults, cached);
    }
    throw new Error(`Module "${namespace}" store is cold. Call reloadModuleStore() during startup.`);
}
export async function reloadModuleStore(namespace) {
    const table = moduleTableName(namespace);
    const rows = await getDbDataAll(table);
    moduleStore.set(namespace, runtimeRows(rows));
}
export async function reloadAllModuleStores(namespaces) {
    await Promise.all(namespaces.map((ns) => reloadModuleStore(ns)));
}
export function isModuleEnabled(namespace) {
    const cached = moduleStore.get(namespace);
    if (!cached)
        return true;
    return cached.enabled !== false;
}
//# sourceMappingURL=texts.js.map