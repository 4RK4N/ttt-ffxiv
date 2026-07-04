import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type {
  ChatInputCommandInteraction,
  Client,
  MessageComponentInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from 'discord.js';
import { isModuleEnabled } from './texts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(__dirname, '..', 'modules');

export type CommandExecutor = (interaction: ChatInputCommandInteraction) => Promise<void>;

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: CommandExecutor;
}

/**
 * Called once after the client is created so a module can register event
 * listeners (e.g. MessageCreate). Modules may export `commands`, `init`, or both.
 */
export type ModuleInit = (client: Client) => void | Promise<void>;

export type ComponentHandler = (interaction: MessageComponentInteraction) => Promise<void>;

export interface ComponentRoute {
  prefix: string;
  handle: ComponentHandler;
}

export interface CommandModule {
  name?: string;
  commands?: Command[];
  init?: ModuleInit;
  componentRoutes?: ComponentRoute[];
}

export interface LoadModulesOptions {
  /** When true, omit slash commands from modules with enabled: false in config. Used by deploy. */
  skipDisabledCommands?: boolean;
}

export interface LoadedModules {
  commandData: RESTPostAPIApplicationCommandsJSONBody[];
  handlers: Map<string, CommandExecutor>;
  inits: ModuleInit[];
  componentRoutes: ComponentRoute[];
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
export async function loadModules(options?: LoadModulesOptions): Promise<LoadedModules> {
  const commandData: RESTPostAPIApplicationCommandsJSONBody[] = [];
  const handlers = new Map<string, CommandExecutor>();
  const inits: ModuleInit[] = [];
  const componentRoutes: ComponentRoute[] = [];

  if (!existsSync(MODULES_DIR)) {
    return { commandData, handlers, inits, componentRoutes };
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
    const namespace = mod.name ?? entry.name;

    const hasCommands = Array.isArray(mod?.commands);
    const hasInit = typeof mod?.init === 'function';
    const hasComponents = Array.isArray(mod?.componentRoutes) && mod.componentRoutes.length > 0;

    if (!hasCommands && !hasInit && !hasComponents) {
      console.warn(
        `[moduleLoader] Module "${namespace}" exports no commands, init, or componentRoutes; skipping.`
      );
      continue;
    }

    const skipCommands =
      options?.skipDisabledCommands === true && hasCommands && !isModuleEnabled(namespace);

    if (skipCommands) {
      console.log(`[moduleLoader] Module "${namespace}" is disabled; skipping command deploy.`);
    }

    if (hasCommands && !skipCommands) {
      for (const command of mod.commands!) {
        if (!command?.data?.name || typeof command.execute !== 'function') {
          console.warn(`[moduleLoader] Invalid command in module "${entry.name}"; skipping.`);
          continue;
        }

        if (handlers.has(command.data.name)) {
          console.warn(
            `[moduleLoader] Duplicate command name "${command.data.name}" found in module "${namespace}"; skipping duplicate.`
          );
          continue;
        }

        commandData.push(command.data.toJSON());
        handlers.set(command.data.name, command.execute);
      }
    }

    if (hasInit) {
      inits.push(mod.init!);
    }

    if (Array.isArray(mod.componentRoutes)) {
      componentRoutes.push(...mod.componentRoutes);
    }

    console.log(`[moduleLoader] Loaded module "${mod.name ?? entry.name}".`);
  }

  return { commandData, handlers, inits, componentRoutes };
}
