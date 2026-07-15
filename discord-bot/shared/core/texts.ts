import path from "node:path";
import { resolveDataDir } from "./dataDir.js";
import { RESERVED_MODULE_KEYS } from "./dbData.js";
import { getDbDataAll } from "./dbData.js";
import { moduleTableName } from "./moduleTable.js";

const DATA_DIR = resolveDataDir();

/** Resolves a path inside a module's data folder: data/<namespace>/<segments>. */
export function moduleDataPath(
  namespace: string,
  ...segments: string[]
): string {
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

function assertSafePathSegment(segment: string, label: string): void {
  if (
    !segment ||
    segment === "." ||
    segment === ".." ||
    segment.includes("\0") ||
    segment.includes("/") ||
    segment.includes("\\")
  ) {
    throw new Error(`Invalid ${label}.`);
  }
}

/**
 * Replaces `{token}` placeholders in a template with the provided values.
 * Unknown tokens are left untouched.
 */
export function format(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

const moduleStore = new Map<string, Record<string, unknown>>();

function merge<T extends object>(defaults: T, overrides: Partial<T>): T {
  return { ...defaults, ...overrides };
}

function cachedData<T extends object>(
  defaults: T,
  rows: Record<string, unknown>,
): T {
  return merge(defaults, rows as Partial<T>);
}

function runtimeRows(rows: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rows)) {
    if (RESERVED_MODULE_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

export function getModuleRowsSync(namespace: string): Record<string, unknown> {
  const cached = moduleStore.get(namespace);
  if (!cached) {
    throw new Error(
      `Module "${namespace}" store is cold. Call reloadModuleStore() during startup.`,
    );
  }
  return { ...cached };
}

export function getModuleDataSync<T extends object>(
  namespace: string,
  defaults: T,
): T {
  const cached = moduleStore.get(namespace);
  if (cached) {
    return cachedData(defaults, cached);
  }
  throw new Error(
    `Module "${namespace}" store is cold. Call reloadModuleStore() during startup.`,
  );
}

export async function reloadModuleStore(namespace: string): Promise<void> {
  const table = moduleTableName(namespace);
  const rows = await getDbDataAll(table);
  moduleStore.set(namespace, runtimeRows(rows));
}

export async function reloadAllModuleStores(
  namespaces: string[],
): Promise<void> {
  await Promise.all(namespaces.map((ns) => reloadModuleStore(ns)));
}

export function isModuleEnabled(namespace: string): boolean {
  const cached = moduleStore.get(namespace);
  if (!cached) return true;
  return cached.enabled !== false;
}
