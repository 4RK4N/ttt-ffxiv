import { assertSnowflake, assertSnowflakesInArray } from "../../core/discordIds.js";
import { parsePanelBaseFields } from "../../core/panelFields.js";
import { toStringArray } from "../../core/strings.js";
import type { ResolvedTicketType } from "./types.js";

/** Discord embed description limit (used when welcome exceeds plain content max). */
const TICKET_WELCOME_MAX = 4096;

export function validateTicketType(ticketType: ResolvedTicketType): void {
  if (!ticketType.openButtonLabel.trim()) {
    throw new Error("Open button label is required.");
  }

  if (!ticketType.panelTitle.trim()) {
    throw new Error("Panel title is required.");
  }

  if (ticketType.staffRoleIds.length === 0) {
    throw new Error("At least one staff role is required.");
  }

  if (ticketType.ticketWelcome.length > TICKET_WELCOME_MAX) {
    throw new Error(
      "Ticket welcome must be 4096 characters or fewer (Discord embed limit).",
    );
  }

  if (
    ticketType.roleActionRoleId &&
    !ticketType.roleActionButtonLabel.trim()
  ) {
    throw new Error(
      "Role action button label is required when a role action role is set.",
    );
  }

  if (!ticketType.closeButtonLabel.trim()) {
    throw new Error("Close button label is required.");
  }

  if (!ticketType.deleteButtonLabel.trim()) {
    throw new Error("Delete button label is required.");
  }

  if (
    !ticketType.confirmClosePrompt.trim() ||
    !ticketType.confirmCloseYes.trim() ||
    !ticketType.confirmCloseNo.trim()
  ) {
    throw new Error(
      "Close confirmation prompt, yes label, and no label are required.",
    );
  }

  if (
    !ticketType.confirmDeletePrompt.trim() ||
    !ticketType.confirmDeleteYes.trim() ||
    !ticketType.confirmDeleteNo.trim()
  ) {
    throw new Error(
      "Delete confirmation prompt, yes label, and no label are required.",
    );
  }

  if (ticketType.channelId.trim()) {
    assertSnowflake(ticketType.channelId, "Channel ID");
  }
  assertSnowflakesInArray(ticketType.staffRoleIds, "Staff role IDs");
  assertSnowflakesInArray(ticketType.deniedRoleIds, "Denied role IDs");
  if (ticketType.roleActionRoleId) {
    assertSnowflake(ticketType.roleActionRoleId, "Role action role ID");
  }
}

export function validateTicketTypeRow(
  configRow: Record<string, unknown>,
  textRow: Record<string, unknown>,
): void {
  const base = parsePanelBaseFields(configRow, textRow);
  const ticketType: ResolvedTicketType = {
    ...base,
    emoji: typeof configRow.emoji === "string" ? configRow.emoji : "",
    channelId:
      typeof configRow.channelId === "string" ? configRow.channelId : "",
    staffRoleIds: toStringArray(configRow.staffRoleIds),
    deniedRoleIds: toStringArray(configRow.deniedRoleIds),
    roleActionRoleId:
      typeof configRow.roleActionRoleId === "string"
        ? configRow.roleActionRoleId.trim() || undefined
        : undefined,
    openButtonLabel:
      typeof textRow.openButtonLabel === "string"
        ? textRow.openButtonLabel
        : "",
    ticketWelcome:
      typeof textRow.ticketWelcome === "string" ? textRow.ticketWelcome : "",
    closeButtonLabel:
      typeof textRow.closeButtonLabel === "string"
        ? textRow.closeButtonLabel
        : "",
    confirmClosePrompt:
      typeof textRow.confirmClosePrompt === "string"
        ? textRow.confirmClosePrompt
        : "",
    confirmCloseYes:
      typeof textRow.confirmCloseYes === "string"
        ? textRow.confirmCloseYes
        : "",
    confirmCloseNo:
      typeof textRow.confirmCloseNo === "string" ? textRow.confirmCloseNo : "",
    ticketClosed:
      typeof textRow.ticketClosed === "string" ? textRow.ticketClosed : "",
    deleteButtonLabel:
      typeof textRow.deleteButtonLabel === "string"
        ? textRow.deleteButtonLabel
        : "",
    confirmDeletePrompt:
      typeof textRow.confirmDeletePrompt === "string"
        ? textRow.confirmDeletePrompt
        : "",
    confirmDeleteYes:
      typeof textRow.confirmDeleteYes === "string"
        ? textRow.confirmDeleteYes
        : "",
    confirmDeleteNo:
      typeof textRow.confirmDeleteNo === "string"
        ? textRow.confirmDeleteNo
        : "",
    ticketDeleted:
      typeof textRow.ticketDeleted === "string" ? textRow.ticketDeleted : "",
    alreadyOpen:
      typeof textRow.alreadyOpen === "string" ? textRow.alreadyOpen : "",
    openSuccess:
      typeof textRow.openSuccess === "string" ? textRow.openSuccess : "",
    roleDenied:
      typeof textRow.roleDenied === "string" ? textRow.roleDenied : "",
    roleActionButtonLabel:
      typeof textRow.roleActionButtonLabel === "string"
        ? textRow.roleActionButtonLabel
        : "",
    roleActionConfirmation:
      typeof textRow.roleActionConfirmation === "string"
        ? textRow.roleActionConfirmation
        : "",
  };

  validateTicketType(ticketType);
}
