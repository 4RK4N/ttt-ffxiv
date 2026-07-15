import type { ChatInputCommandInteraction, Client, MessageComponentInteraction, RESTPostAPIApplicationCommandsJSONBody, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";
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
 * Discovers every module under bot/src/modules (each folder's index.ts/js) and aggregates the slash
 * commands they export.
 *
 * Each module's default export (or named `module`) should match `CommandModule`.
 *
 * Adding a new feature later means dropping in a new folder here - no changes to
 * the core are required.
 */
export declare function loadModules(options?: LoadModulesOptions): Promise<LoadedModules>;
//# sourceMappingURL=moduleLoader.d.ts.map