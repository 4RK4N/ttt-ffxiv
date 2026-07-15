import { CLOSE_CONFIRM_PREFIX, CLOSE_PREFIX, DELETE_CONFIRM_PREFIX, DELETE_PREFIX, ROLE_ACTION_PREFIX, } from "../../lib/modules/tickets/panel.js";
export function parseCloseCustomId(customId) {
    const confirm = customId.startsWith(CLOSE_CONFIRM_PREFIX);
    const prefix = confirm ? CLOSE_CONFIRM_PREFIX : CLOSE_PREFIX;
    if (!customId.startsWith(prefix))
        return null;
    const segments = customId.slice(prefix.length).split(":");
    if (segments.length < 2)
        return null;
    const threadId = segments[0];
    if (segments.length >= 3) {
        return { threadId, typeId: segments[1], openerUserId: segments[2] };
    }
    return { threadId, typeId: segments.slice(1).join(":") };
}
export function parseDeleteCustomId(customId) {
    const confirm = customId.startsWith(DELETE_CONFIRM_PREFIX);
    const prefix = confirm ? DELETE_CONFIRM_PREFIX : DELETE_PREFIX;
    if (!customId.startsWith(prefix))
        return null;
    const segments = customId.slice(prefix.length).split(":");
    if (segments.length < 2)
        return null;
    return { threadId: segments[0], typeId: segments.slice(1).join(":") };
}
export function parseRoleActionCustomId(customId) {
    if (!customId.startsWith(ROLE_ACTION_PREFIX))
        return null;
    const segments = customId.slice(ROLE_ACTION_PREFIX.length).split(":");
    if (segments.length < 3)
        return null;
    return {
        threadId: segments[0],
        typeId: segments[1],
        openerUserId: segments[2],
    };
}
//# sourceMappingURL=parsers.js.map