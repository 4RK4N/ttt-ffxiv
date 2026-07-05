import { type ButtonInteraction } from "discord.js";
import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import type { RoleChangeResult } from "../../lib/core/discordRoles.js";
import { format } from "../../../../shared/core/texts.js";
import type {
  ReactionRolesTexts,
  ResolvedRolePanel,
} from "../../../../shared/modules/reaction-roles/types.js";

export interface EphemeralContext {
  mention: string;
  role: string;
}

export function formatEphemeralMessage(
  panel: ResolvedRolePanel,
  context: EphemeralContext,
): string | undefined {
  const template = panel.ephemeralMessage?.trim();
  if (!template) return undefined;
  return format(template, { mention: context.mention, role: context.role });
}

/** Replies with a role-error ephemeral when assign/remove failed; returns true on success. */
export async function replyRoleResult(
  interaction: ButtonInteraction,
  result: RoleChangeResult,
  t: Pick<ReactionRolesTexts, "roleError" | "roleHierarchyError">,
): Promise<boolean> {
  if (result.ok) return true;
  await replyEphemeral(
    interaction,
    result.reason === "hierarchy" ? t.roleHierarchyError : t.roleError,
  );
  return false;
}
