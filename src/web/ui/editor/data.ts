import type { WebPlugin } from '../../plugin-types.js';
import type { WebConfig } from '../../config.js';
import { listGuildChannels } from '../../channels.js';
import { listGuildRoles } from '../../roles.js';
import { readEnabled, readValues } from '../../store.js';
import type { EditorContext } from './context.js';
import { pluginToModule } from './context.js';

export async function loadEditorContext(cfg: WebConfig, csrfToken: string): Promise<EditorContext> {
  let channels: EditorContext['channels'] = [];
  let roles: EditorContext['roles'] = [];
  let channelsError: string | null = null;
  let rolesError: string | null = null;

  try {
    channels = await listGuildChannels(cfg);
  } catch (err) {
    console.error('[web] Failed to load channels:', err);
    channelsError = 'Could not load channels.';
  }

  try {
    roles = await listGuildRoles(cfg);
  } catch (err) {
    console.error('[web] Failed to load roles:', err);
    rolesError = 'Could not load roles.';
  }

  return { csrfToken, channels, roles, channelsError, rolesError };
}

export function buildEditorModule(plugin: WebPlugin) {
  return pluginToModule(plugin, readValues(plugin), readEnabled(plugin.namespace));
}

export function parseExpanded(query: string | undefined): string[] {
  if (!query?.trim()) return [];
  return query.split(',').filter(Boolean);
}
