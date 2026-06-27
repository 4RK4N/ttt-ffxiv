import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type {
  ChatInputCommandInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'modules');

export type CommandExecutor = (interaction: ChatInputCommandInteraction) => Promise<void>;

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: CommandExecutor;
}

export interface CommandModule {
  name?: string;
  commands: Command[];
}

export interface LoadedModules {
  commandData: RESTPostAPIApplicationCommandsJSONBody[];
  handlers: Map<string, CommandExecutor>;
}

/**
 * Discovers every module under src/modules/*\/index.js and aggregates the slash
 * commands they export.
 *
 * Each module's default export (or named `module`) should match `CommandModule`.
 *
 * Adding a new feature later means dropping in a new folder here - no changes to
 * the core are required.
 */
export async function loadModules(): Promise<LoadedModules> {
  const commandData: RESTPostAPIApplicationCommandsJSONBody[] = [];
  const handlers = new Map<string, CommandExecutor>();

  if (!existsSync(MODULES_DIR)) {
    return { commandData, handlers };
  }

  const entries = await readdir(MODULES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    // Compiled modules are emitted as index.js alongside this loader, so the
    // runtime import target keeps the .js extension.
    const modulePath = join(MODULES_DIR, entry.name, 'index.js');
    if (!existsSync(modulePath)) continue;

    const imported = await import(pathToFileURL(modulePath).href);
    const mod: CommandModule = imported.default ?? imported.module ?? imported;

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
