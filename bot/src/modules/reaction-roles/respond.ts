import { format } from '../../../../shared/core/texts.js';
import type { ResolvedRolePanel } from '../../../../shared/modules/reaction-roles/types.js';

export interface EphemeralContext {
  mention: string;
  role: string;
}

export function formatEphemeralMessage(
  panel: ResolvedRolePanel,
  context: EphemeralContext
): string | undefined {
  const template = panel.ephemeralMessage?.trim();
  if (!template) return undefined;
  return format(template, { mention: context.mention, role: context.role });
}
