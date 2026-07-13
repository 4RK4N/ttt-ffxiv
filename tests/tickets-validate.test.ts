import { describe, expect, it } from "vitest";
import { validateTicketType } from "../shared/modules/tickets/validate.js";
import type { ResolvedTicketType } from "../shared/modules/tickets/types.js";

function baseTicketType(
  overrides: Partial<ResolvedTicketType> = {},
): ResolvedTicketType {
  return {
    id: "support",
    published: true,
    emoji: "🎫",
    channelId: "123456789012345678",
    panelMessageId: "",
    staffRoleId: "111111111111111111",
    deniedRoleIds: [],
    openButtonLabel: "Open ticket",
    panelTitle: "Support",
    panelDescription: "Get help",
    ticketWelcome: "Hi {mention}",
    closeButtonLabel: "Close",
    confirmClosePrompt: "Close this ticket?",
    confirmCloseYes: "Yes",
    confirmCloseNo: "No",
    ticketClosed: "Closed.",
    deleteButtonLabel: "Delete",
    confirmDeletePrompt: "Delete permanently?",
    confirmDeleteYes: "Yes",
    confirmDeleteNo: "No",
    ticketDeleted: "Deleted.",
    alreadyOpen: "Already open.",
    openSuccess: "Created {thread}",
    roleDenied: "Denied.",
    roleActionButtonLabel: "Grant role",
    roleActionConfirmation: "Done.",
    ...overrides,
  };
}

describe("validateTicketType", () => {
  it("accepts a complete ticket type", () => {
    expect(() => validateTicketType(baseTicketType())).not.toThrow();
  });

  it("requires staff role", () => {
    expect(() =>
      validateTicketType(baseTicketType({ staffRoleId: "" })),
    ).toThrow(/staff role/i);
  });

  it("requires open button label", () => {
    expect(() =>
      validateTicketType(baseTicketType({ openButtonLabel: "  " })),
    ).toThrow(/open button/i);
  });

  it("requires close confirmation no label", () => {
    expect(() =>
      validateTicketType(baseTicketType({ confirmCloseNo: "  " })),
    ).toThrow(/no label/i);
  });

  it("requires delete confirmation no label", () => {
    expect(() =>
      validateTicketType(baseTicketType({ confirmDeleteNo: "" })),
    ).toThrow(/no label/i);
  });

  it("accepts ticketWelcome up to 4096 characters", () => {
    const welcome = "x".repeat(4096);
    expect(() =>
      validateTicketType(baseTicketType({ ticketWelcome: welcome })),
    ).not.toThrow();
  });

  it("rejects ticketWelcome over 4096 characters", () => {
    const welcome = "x".repeat(4097);
    expect(() =>
      validateTicketType(baseTicketType({ ticketWelcome: welcome })),
    ).toThrow(/4096/);
  });
});
