import type { EditorModule, GuildChannel, GuildRole, WebPlugin } from "../../plugin-types.js";
export interface EditorContext {
    csrfToken: string;
    channels: GuildChannel[];
    roles: GuildRole[];
    channelsError: string | null;
    rolesError: string | null;
}
export interface PanelProps {
    mod: EditorModule;
    ctx: EditorContext;
    expanded?: string[];
    status?: {
        ok: boolean;
        message: string;
    };
}
export declare function pluginToModule(plugin: WebPlugin, values: Record<string, unknown>, enabled: boolean): EditorModule;
//# sourceMappingURL=context.d.ts.map