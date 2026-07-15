import { toStringArray } from "../../core/strings.js";
import { createListResolver, createModuleData, moduleDefaultsFromParts, } from "../../core/moduleConfig.js";
export const NAMESPACE = "tickets";
export const DEFAULT_TYPE_TEXTS = {
    openButtonLabel: "Open ticket",
    panelTitle: "Support",
    panelDescription: "Click the button below to open a private ticket.",
    ticketWelcome: "Hi {mention}, describe your issue and staff will assist you.",
    closeButtonLabel: "Close ticket",
    confirmClosePrompt: "Are you sure you want to close this ticket?",
    confirmCloseYes: "Yes, close",
    confirmCloseNo: "Cancel",
    ticketClosed: "This ticket has been closed.",
    deleteButtonLabel: "DELETE",
    confirmDeletePrompt: "Delete this closed ticket permanently?",
    confirmDeleteYes: "Yes, delete",
    confirmDeleteNo: "Cancel",
    ticketDeleted: "Ticket deleted.",
    alreadyOpen: "You already have an open ticket in this category.",
    openSuccess: "Your ticket was created: {thread}",
    roleDenied: "You cannot open a ticket in this category.",
    roleActionButtonLabel: "Grant role",
    roleActionConfirmation: "{mention} was given {role}.",
};
export const TEXT_DEFAULTS = {
    disabled: "Tickets are currently disabled.",
    noPermission: "You don't have permission to close this ticket.",
    noDeletePermission: "You don't have permission to delete this ticket.",
    deleteNotClosed: "Only closed tickets can be deleted.",
    categoryUnpublished: "This ticket category is not available right now.",
    channelNotConfigured: "This ticket category is not configured yet.",
    invalidChannel: "The configured ticket channel is invalid.",
    openError: "Something went wrong while opening your ticket. Please try again.",
    closeError: "Something went wrong while closing this ticket.",
    deleteError: "Something went wrong while deleting this ticket.",
    closeCancelled: "Close cancelled.",
    deleteCancelled: "Delete cancelled.",
    threadContextRequired: "This action must be used inside a ticket thread.",
    invalidInteraction: "This button does not match the current ticket thread.",
    openInProgress: "Your ticket is being opened — please wait a moment.",
    roleActionError: "Could not assign the role. Please try again or contact an admin.",
    roleActionHierarchyError: "I cannot assign that role — it is above my highest role.",
    roleActionOpenerMissing: "Could not find the ticket opener to assign the role.",
};
export const CONFIG_DEFAULTS = {
    enabled: true,
    ticketTypes: [],
};
export const MODULE_DEFAULTS = moduleDefaultsFromParts(CONFIG_DEFAULTS, TEXT_DEFAULTS);
const mod = createModuleData(NAMESPACE, MODULE_DEFAULTS);
export const get = mod.get;
export const data = mod.data;
export function resolveTicketType(id) {
    return resolveTicketTypeById(id);
}
const resolveTicketTypeById = createListResolver({
    get,
    listKey: "ticketTypes",
    defaultTexts: DEFAULT_TYPE_TEXTS,
    normalize: (row) => ({
        ...DEFAULT_TYPE_TEXTS,
        ...row,
        staffRoleId: row.staffRoleId?.trim() ?? "",
        deniedRoleIds: toStringArray(row.deniedRoleIds),
        roleActionRoleId: row.roleActionRoleId?.trim() || undefined,
    }),
});
//# sourceMappingURL=types.js.map