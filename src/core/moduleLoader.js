import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'modules');

/**
 * Discovers every module under src/modules/*\/index.js and aggregates the slash
 * commands they export.
 *
 * Each module's default export (or named `module`) should look like:
 *   { name: string, commands: [{ data: SlashCommandBuilder, execute: fn }] }
 *
 * Adding a new feature later means dropping in a new folder here - no changes to
 * the core are required.
 *
 * @returns {Promise<{ commandData: object[], handlers: Map<string, Function> }>}
 */
export async function loadModules() {
  const commandData = [];
  const handlers = new Map();

  if (!existsSync(MODULES_DIR)) {
    return { commandData, handlers };
  }

  const entries = await readdir(MODULES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const modulePath = join(MODULES_DIR, entry.name, 'index.js');
    if (!existsSync(modulePath)) continue;

    const imported = await import(pathToFileURL(modulePath).href);
    const mod = imported.default ?? imported.module ?? imported;

    if (!Array.isArray(mod?.commands)) {
      console.warn(`[moduleLoader] Module "${entry.name}" exports no commands array; skipping.`);
      continue;
    }

    for (const command of mod.commands) {
      if (!command?.data?.name || typeof command.execute !== 'function') {
        console.warn(`[moduleLoader] Invalid command in module "${entry.name}"; skipping.`);
        continue;
      }

      if (handlers.has(command.data.name)) {
        console.warn(
          `[moduleLoader] Duplicate command name "${command.data.name}" found in module "${entry.name}"; skipping duplicate.`
        );
        continue;
      }

      commandData.push(command.data.toJSON());
      handlers.set(command.data.name, command.execute);
    }

    console.log(`[moduleLoader] Loaded module "${mod.name ?? entry.name}".`);
  }

  return { commandData, handlers };
}
