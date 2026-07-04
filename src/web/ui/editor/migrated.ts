/** Modules served by the HTMX server-rendered editor (not editor.js). */
export const HTMX_MIGRATED = new Set([
  'welcome-message',
  'pic-repost-commands',
  'links-pics-vids-autothread',
  'moderation-log',
  'custom-embeds',
  'tickets',
  'reaction-roles',
]);

export function isHtmxMigrated(namespace: string): boolean {
  return HTMX_MIGRATED.has(namespace);
}
