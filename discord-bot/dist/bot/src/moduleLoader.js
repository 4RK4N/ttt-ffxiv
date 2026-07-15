import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isModuleEnabled } from "#shared/core/texts.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, "modules");
/** Resolves index.ts (tsx/vitest) or index.js (compiled) for a module folder. */
function resolveModuleIndexPath(moduleName) {
    for (const ext of ["js", "ts"]) {
        const candidate = join(MODULES_DIR, moduleName, `index.${ext}`);
        if (existsSync(candidate))
            return candidate;
    }
    return null;
}
/**
 * Discovers every module under bot/src/modules (each folder's index.ts/js) and aggregates the slash
 * commands they export.
 *
 * Each module's default export (or named `module`) should match `CommandModule`.
 *
 * Adding a new feature later means dropping in a new folder here - no changes to
 * the core are required.
 */
export async function loadModules(options) {
    const commandData = [];
    const handlers = new Map();
    const inits = [];
    const componentRoutes = [];
    if (!existsSync(MODULES_DIR)) {
        throw new Error(`[moduleLoader] Modules directory not found at "${MODULES_DIR}". ` +
            "Expected bot/src/modules/ (dev) or dist/bot/src/modules/ (compiled).");
    }
    const entries = await readdir(MODULES_DIR, { withFileTypes: true });
    for (const entry of entries) {
        if (!entry.isDirectory())
            continue;
        const modulePath = resolveModuleIndexPath(entry.name);
        if (!modulePath)
            continue;
        const imported = await import(pathToFileURL(modulePath).href);
        const mod = imported.default ?? imported.module ?? imported;
        const namespace = mod.name ?? entry.name;
        const hasCommands = Array.isArray(mod?.commands);
        const hasInit = typeof mod?.init === "function";
        const hasComponents = Array.isArray(mod?.componentRoutes) && mod.componentRoutes.length > 0;
        if (!hasCommands && !hasInit && !hasComponents) {
            console.warn(`[moduleLoader] Module "${namespace}" exports no commands, init, or componentRoutes; skipping.`);
            continue;
        }
        const skipCommands = options?.skipDisabledCommands === true &&
            hasCommands &&
            !isModuleEnabled(namespace);
        if (skipCommands) {
            console.log(`[moduleLoader] Module "${namespace}" is disabled; skipping command deploy.`);
        }
        if (hasCommands && !skipCommands) {
            for (const command of mod.commands) {
                if (!command?.data?.name || typeof command.execute !== "function") {
                    console.warn(`[moduleLoader] Invalid command in module "${entry.name}"; skipping.`);
                    continue;
                }
                if (handlers.has(command.data.name)) {
                    console.warn(`[moduleLoader] Duplicate command name "${command.data.name}" found in module "${namespace}"; skipping duplicate.`);
                    continue;
                }
                commandData.push(command.data.toJSON());
                handlers.set(command.data.name, command.execute);
            }
        }
        if (hasInit) {
            if (isModuleEnabled(namespace)) {
                inits.push(mod.init);
            }
            else {
                console.log(`[moduleLoader] Module "${namespace}" is disabled; skipping init.`);
            }
        }
        if (Array.isArray(mod.componentRoutes)) {
            componentRoutes.push(...mod.componentRoutes);
        }
        console.log(`[moduleLoader] Loaded module "${mod.name ?? entry.name}".`);
    }
    if (handlers.size === 0 &&
        inits.length === 0 &&
        componentRoutes.length === 0) {
        throw new Error(`[moduleLoader] No modules loaded from "${MODULES_DIR}". ` +
            "Each folder needs commands, init, or componentRoutes.");
    }
    return { commandData, handlers, inits, componentRoutes };
}
//# sourceMappingURL=moduleLoader.js.map