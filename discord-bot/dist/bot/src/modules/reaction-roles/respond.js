import { replyEphemeral } from "../../lib/core/discordInteractions.js";
import { roleChangeErrorMessage, } from "../../lib/core/discordRoles.js";
import { format } from "#shared/core/texts.js";
export function formatEphemeralMessage(panel, context) {
    const template = panel.ephemeralMessage?.trim();
    if (!template)
        return undefined;
    return format(template, { mention: context.mention, role: context.role });
}
/** Replies with a role-error ephemeral when assign/remove failed; returns true on success. */
export async function replyRoleResult(interaction, result, t) {
    if (result.ok)
        return true;
    await replyEphemeral(interaction, roleChangeErrorMessage(result, t.roleHierarchyError, t.roleError));
    return false;
}
//# sourceMappingURL=respond.js.map