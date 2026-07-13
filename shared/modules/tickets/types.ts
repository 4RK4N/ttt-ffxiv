import { toStringArray } from "../../core/strings.js";
import {
  createModuleData,
  findListItemById,
  moduleDefaultsFromParts,
} from "../../core/moduleConfig.js";

export const NAMESPACE = "tickets";

export interface TicketTypeConfig {
  id: string;
  published: boolean;
  emoji: string;
  channelId: string;
  panelMessageId: string;
  staffRoleId: string;
  deniedRoleIds: string[];
  roleActionRoleId?: string;
}

export interface TicketTypeTexts {
  openButtonLabel: string;
  panelTitle: string;
  panelDescription: string;
  ticketWelcome: string;
  closeButtonLabel: string;
  confirmClosePrompt: string;
  confirmCloseYes: string;
  confirmCloseNo: string;
  ticketClosed: string;
  deleteButtonLabel: string;
  confirmDeletePrompt: string;
  confirmDeleteYes: string;
  confirmDeleteNo: string;
  ticketDeleted: string;
  alreadyOpen: string;
  openSuccess: string;
  roleDenied: string;
  roleActionButtonLabel: string;
  roleActionConfirmation: string;
}

export interface ResolvedTicketType extends TicketTypeConfig, TicketTypeTexts { }

export interface TicketsConfig {
  enabled?: boolean;
  ticketTypes: TicketTypeConfig[];
}

export interface TicketsTexts {
  disabled: string;
  noPermission: string;
  noDeletePermission: string;
  deleteNotClosed: string;
  categoryUnpublished: string;
  channelNotConfigured: string;
  invalidChannel: string;
  openError: string;
  closeError: string;
  deleteError: string;
  closeCancelled: string;
  deleteCancelled: string;
  threadContextRequired: string;
  invalidInteraction: string;
  openInProgress: string;
  roleActionError: string;
  roleActionHierarchyError: string;
  roleActionOpenerMissing: string;
}

export const DEFAULT_TYPE_TEXTS: TicketTypeTexts = {
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

export const TEXT_DEFAULTS: TicketsTexts = {
  disabled: "Tickets are currently disabled.",
  noPermission: "You don't have permission to close this ticket.",
  noDeletePermission: "You don't have permission to delete this ticket.",
  deleteNotClosed: "Only closed tickets can be deleted.",
  categoryUnpublished: "This ticket category is not available right now.",
  channelNotConfigured: "This ticket category is not configured yet.",
  invalidChannel: "The configured ticket channel is invalid.",
  openError:
    "Something went wrong while opening your ticket. Please try again.",
  closeError: "Something went wrong while closing this ticket.",
  deleteError: "Something went wrong while deleting this ticket.",
  closeCancelled: "Close cancelled.",
  deleteCancelled: "Delete cancelled.",
  threadContextRequired: "This action must be used inside a ticket thread.",
  invalidInteraction: "This button does not match the current ticket thread.",
  openInProgress: "Your ticket is being opened — please wait a moment.",
  roleActionError:
    "Could not assign the role. Please try again or contact an admin.",
  roleActionHierarchyError:
    "I cannot assign that role — it is above my highest role.",
  roleActionOpenerMissing:
    "Could not find the ticket opener to assign the role.",
};

export const CONFIG_DEFAULTS: TicketsConfig = {
  enabled: true,
  ticketTypes: [],
};

export type TicketsModuleData = TicketsConfig & TicketsTexts;

export const MODULE_DEFAULTS: TicketsModuleData = moduleDefaultsFromParts(
  CONFIG_DEFAULTS,
  TEXT_DEFAULTS,
);

const mod = createModuleData(NAMESPACE, MODULE_DEFAULTS);

export const get = mod.get;
export const data = mod.data;

export function resolveTicketType(id: string): ResolvedTicketType | undefined {
  const row = findListItemById(
    get("ticketTypes") as Array<TicketTypeConfig & Partial<TicketTypeTexts>>,
    id,
  );
  if (!row) return undefined;
  return {
    ...DEFAULT_TYPE_TEXTS,
    ...row,
    staffRoleId: row.staffRoleId?.trim() ?? "",
    deniedRoleIds: toStringArray(row.deniedRoleIds),
    roleActionRoleId: row.roleActionRoleId?.trim() || undefined,
  } as ResolvedTicketType;
}
