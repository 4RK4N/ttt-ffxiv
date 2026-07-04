import type { EditorModule, GuildChannel, GuildRole, WebPlugin } from '../../plugin-types.js';

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
  status?: { ok: boolean; message: string };
}

export function pluginToModule(
  plugin: WebPlugin,
  values: Record<string, unknown>,
  enabled: boolean,
): EditorModule {
  return {
    namespace: plugin.namespace,
    title: plugin.title,
    description: plugin.description,
    fields: plugin.fields,
    values,
    enabled,
  };
}
