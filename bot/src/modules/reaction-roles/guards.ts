import type { MessageComponentInteraction } from "discord.js";
import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { isModuleEnabled } from "../../../../shared/core/texts.js";
import {
  NAMESPACE,
  resolvePanel,
  texts,
} from "../../lib/modules/reaction-roles/config-io.js";
import type {
  ReactionType,
  ResolvedRolePanel,
} from "../../../../shared/modules/reaction-roles/types.js";

export type PanelGuardResult =
  | { ok: true; panel: ResolvedRolePanel; t: ReturnType<typeof texts> }
  | { ok: false };

function matchesReactionType(
  panel: ResolvedRolePanel,
  allowed: ReactionType | ReactionType[],
): boolean {
  const types = Array.isArray(allowed) ? allowed : [allowed];
  return types.includes(panel.reactionType);
}

/** Shared preamble for button/select interactions on a published role panel. */
export async function guardPublishedPanel(
  interaction: MessageComponentInteraction,
  panelId: string,
  options: {
    reactionType: ReactionType | ReactionType[];
    requireGuild?: boolean;
  },
): Promise<PanelGuardResult> {
  const t = texts();

  if (!isModuleEnabled(NAMESPACE)) {
    await replyEphemeral(interaction, t.disabled);
    return { ok: false };
  }

  const panel = resolvePanel(panelId);
  if (!panel || !panel.published) {
    await replyEphemeral(interaction, t.panelUnpublished);
    return { ok: false };
  }

  if (!matchesReactionType(panel, options.reactionType)) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return { ok: false };
  }

  if (
    !isActivePanelMessage(panel, interaction.channelId, interaction.message.id)
  ) {
    await replyEphemeral(interaction, t.invalidInteraction);
    return { ok: false };
  }

  if (options.requireGuild && !interaction.guild) {
    await replyEphemeral(interaction, t.roleError);
    return { ok: false };
  }

  return { ok: true, panel, t };
}

/** True when the interaction is on the panel's current published message. */
export function isActivePanelMessage(
  panel: ResolvedRolePanel,
  channelId: string | null,
  messageId: string | undefined,
): boolean {
  if (!panel.panelMessageId || !messageId) return false;
  if (panel.panelMessageId !== messageId) return false;
  if (panel.channelId && channelId && panel.channelId !== channelId)
    return false;
  return true;
}
