import type { ResolvedRolePanel } from './types.js';

/** True when the interaction is on the panel's current published message. */
export function isActivePanelMessage(
  panel: ResolvedRolePanel,
  channelId: string | null,
  messageId: string | undefined
): boolean {
  if (!panel.panelMessageId || !messageId) return false;
  if (panel.panelMessageId !== messageId) return false;
  if (panel.channelId && channelId && panel.channelId !== channelId) return false;
  return true;
}
