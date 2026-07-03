/**
 * Handler patterns — copy these into your module's handler files.
 *
 * Demonstrates:
 * - Importing config/texts via config-io.ts (not types.ts)
 * - isModuleEnabled() guard
 * - config() for settings, texts() for copy
 * - format() for {token} substitution in text templates
 */
import { format, isModuleEnabled } from '../../core/texts.js';
import { replyEphemeral } from '../../core/discordInteractions.js';
import type { Message } from 'discord.js';
import { config, NAMESPACE, targetChannelId, texts } from './config-io.js';

// -----------------------------------------------------------------------------
// Reading config
// -----------------------------------------------------------------------------

/** Always check the master switch first (web editor toggle + config.enabled). */
export function isExampleEnabled(): boolean {
  return isModuleEnabled(NAMESPACE);
}

/** Config fields hot-reload when data/<namespace>/config.json changes. */
export function isTargetChannel(message: Message): boolean {
  const channelId = targetChannelId();
  return channelId !== undefined && message.channelId === channelId;
}

/** Example: read a boolean toggle from config (add to ExampleConfig + web-plugin). */
export function someFeatureEnabled(): boolean {
  // return config().someFlag === true;
  return true;
}

// -----------------------------------------------------------------------------
// Reading texts
// -----------------------------------------------------------------------------

/**
 * texts() loads data/<namespace>/texts.json merged over TEXT_DEFAULTS from types.ts.
 * Call it when you need fresh copy (each call may re-read if the file changed).
 */
export function disabledReply(): string {
  return texts().disabled;
}

/** Use format() for placeholders defined in texts.json / TEXT_DEFAULTS. */
export function greetingForUser(userId: string): string {
  return format(texts().greeting, { mention: `<@${userId}>` });
}

/** Cache locally only if you use the same strings many times in one handler. */
export function loadTextBundle() {
  const t = texts();
  return { disabled: t.disabled, greeting: t.greeting };
}

// -----------------------------------------------------------------------------
// Combined guard (typical event handler preamble)
// -----------------------------------------------------------------------------

/**
 * Returns false when the handler should no-op. Pattern used across real modules
 * (welcome-message, tickets, reaction-roles, etc.).
 */
export function shouldHandleMessage(message: Message): boolean {
  if (message.author.bot || message.system) return false;
  if (!isExampleEnabled()) return false;
  if (!isTargetChannel(message)) return false;
  return true;
}

// -----------------------------------------------------------------------------
// Panel module: resolved item (uncomment when using panel types in types.ts)
// -----------------------------------------------------------------------------

/*
import { resolveExamplePanel } from './types.js';
import { getExamplePanelConfig } from './config-io.js';

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
// Component interaction helper (buttons/selects)
// -----------------------------------------------------------------------------

export async function replyDisabledEphemeral(
  interaction: Parameters<typeof replyEphemeral>[0]
): Promise<void> {
  await replyEphemeral(interaction, disabledReply());
}

/** Log config snapshot for debugging (never log secrets/tokens). */
export function logConfigSnapshot(): void {
  const cfg = config();
  console.log(`[${NAMESPACE}] channelId=${cfg.channelId || '(unset)'}`);
}
