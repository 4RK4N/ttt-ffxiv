/**
 * Handler patterns — copy into your module's handler files.
 *
 * Import runtime config/texts from config-io.ts (not types.ts).
 * Import types from types.ts only when you need interfaces.
 */
import { format, isModuleEnabled } from "../../../../shared/core/texts.js";
import {
  memberHasAnyRole,
  replyEphemeral,
} from "../../lib/core/discordInteractions.js";
import type { Message } from "discord.js";
import {
  NAMESPACE,
  targetChannelId,
  texts,
} from "../../lib/modules/example-module/config-io.js";

// Optional core imports (uncomment when needed):
// import { tryAssignRole } from '../../lib/core/discordRoles.js';
// import { startAndPopulateCommentsThread, buildThreadName } from '../../lib/core/threads.js';

// -----------------------------------------------------------------------------
// Reading config
// -----------------------------------------------------------------------------

export function isExampleEnabled(): boolean {
  return isModuleEnabled(NAMESPACE);
}

export function isTargetChannel(message: Message): boolean {
  const channelId = targetChannelId();
  return channelId !== undefined && message.channelId === channelId;
}

// -----------------------------------------------------------------------------
// Reading texts
// -----------------------------------------------------------------------------

export function disabledReply(): string {
  return texts().disabled;
}

export function greetingForUser(userId: string): string {
  return format(texts().greeting, { mention: `<@${userId}>` });
}

// -----------------------------------------------------------------------------
// Combined guard (typical event handler preamble)
// -----------------------------------------------------------------------------

export function shouldHandleMessage(message: Message): boolean {
  if (message.author.bot || message.system) return false;
  if (!isExampleEnabled()) return false;
  if (!isTargetChannel(message)) return false;
  return true;
}

// -----------------------------------------------------------------------------
// Panel module (uncomment when using panel types + config-io panel block)
// -----------------------------------------------------------------------------

/*
import { getExamplePanelConfig, resolveExamplePanel } from '../../lib/modules/<name>/config-io.js';

export function requirePublishedPanel(panelId: string) {
  const resolved = resolveExamplePanel(panelId);
  if (!resolved?.published) return undefined;
  return resolved;
}

export function panelConfigRow(panelId: string) {
  return getExamplePanelConfig(panelId);
}
*/

// -----------------------------------------------------------------------------
// Role checks / assignment (uncomment when needed)
// -----------------------------------------------------------------------------

/*
import type { GuildMember } from 'discord.js';

export function memberHasExampleRole(member: GuildMember, roleIds: string[]): boolean {
  return memberHasAnyRole(member, roleIds);
}

export async function grantExampleRole(member: GuildMember, roleId: string) {
  return tryAssignRole(member, roleId, `[${NAMESPACE}]`);
}
*/

// -----------------------------------------------------------------------------
// Comments thread (uncomment for /pic-style or auto-thread modules)
// -----------------------------------------------------------------------------

/*
export async function startExampleCommentsThread(
  message: Message,
  displayName: string,
  caption: string,
  firstMessage: string
): Promise<boolean> {
  return startAndPopulateCommentsThread(message, {
    name: buildThreadName(displayName, caption, {
      guild: message.guild,
      client: message.client,
      message,
    }),
    logPrefix: `[${NAMESPACE}]`,
    authorUserId: message.author.id,
    firstMessage,
  });
}
*/

// -----------------------------------------------------------------------------
// Component interactions
// -----------------------------------------------------------------------------

export async function replyDisabledEphemeral(
  interaction: Parameters<typeof replyEphemeral>[0],
): Promise<void> {
  await replyEphemeral(interaction, disabledReply());
}
