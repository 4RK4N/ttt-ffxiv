import { tryAssignRole, tryRemoveRole, roleChangeErrorMessage, } from "../../lib/core/discordRoles.js";
export async function applyDropdownRoleSelection(opts) {
    const { member, panel, selectedOptionIds, guild, texts: t } = opts;
    const applied = [];
    const changedRoleNames = [];
    try {
        for (const opt of panel.roleOptions) {
            if (!opt.roleId.trim())
                continue;
            const isSelected = selectedOptionIds.includes(opt.id);
            const hasRole = member.roles.cache.has(opt.roleId);
            if (panel.toggleable) {
                if (isSelected && !hasRole) {
                    const result = await tryAssignRole(member, opt.roleId);
                    if (!result.ok) {
                        throw new Error(roleChangeErrorMessage(result, t.roleHierarchyError, t.roleError));
                    }
                    applied.push({ roleId: opt.roleId, action: "add" });
                    const name = guild?.roles.cache.get(opt.roleId)?.name;
                    if (name)
                        changedRoleNames.push(name);
                }
                else if (!isSelected && hasRole) {
                    const result = await tryRemoveRole(member, opt.roleId);
                    if (!result.ok) {
                        throw new Error(roleChangeErrorMessage(result, t.roleHierarchyError, t.roleError));
                    }
                    applied.push({ roleId: opt.roleId, action: "remove" });
                    const name = guild?.roles.cache.get(opt.roleId)?.name;
                    if (name)
                        changedRoleNames.push(name);
                }
            }
            else if (isSelected && !hasRole) {
                const result = await tryAssignRole(member, opt.roleId);
                if (!result.ok) {
                    throw new Error(roleChangeErrorMessage(result, t.roleHierarchyError, t.roleError));
                }
                applied.push({ roleId: opt.roleId, action: "add" });
                const name = guild?.roles.cache.get(opt.roleId)?.name;
                if (name)
                    changedRoleNames.push(name);
            }
        }
    }
    catch (err) {
        await rollbackRoleChanges(member, applied);
        throw err;
    }
    return { changedRoleNames };
}
async function rollbackRoleChanges(member, applied) {
    for (let i = applied.length - 1; i >= 0; i--) {
        const { roleId, action } = applied[i];
        if (action === "add")
            await tryRemoveRole(member, roleId);
        else
            await tryAssignRole(member, roleId);
    }
}
//# sourceMappingURL=role-selection.js.map