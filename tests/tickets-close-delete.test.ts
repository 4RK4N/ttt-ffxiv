import { PermissionFlagsBits, type GuildMember } from "discord.js";
import { describe, expect, it, vi } from "vitest";

vi.mock("../shared/core/texts.js", () => ({
  isModuleEnabled: () => true,
}));

vi.mock("../bot/src/lib/modules/tickets/config-io.js", () => ({
  NAMESPACE: "tickets",
  resolveTicketType: (id: string) =>
    id === "support"
      ? {
          id: "support",
          staffRoleId: "111111111111111111",
          confirmClosePrompt: "Close?",
          confirmCloseYes: "Yes",
          confirmCloseNo: "No",
        }
      : null,
  texts: () => ({
    disabled: "Disabled",
    categoryUnpublished: "Unpublished",
    threadContextRequired: "Thread required",
    invalidInteraction: "Invalid",
    noPermission: "No permission",
    deleteNotClosed: "Not closed",
    noDeletePermission: "No delete permission",
    closeError: "Close error",
    deleteError: "Delete error",
    closeCancelled: "Cancelled",
    deleteCancelled: "Cancelled",
  }),
}));

import {
  CLOSE_CONFIRM_PREFIX,
  CLOSE_PREFIX,
  DELETE_CONFIRM_PREFIX,
  DELETE_PREFIX,
} from "../bot/src/lib/modules/tickets/panel.js";
import {
  parseCloseCustomId,
  parseDeleteCustomId,
} from "../bot/src/modules/tickets/parsers.js";
import { runTicketConfirmFlow } from "../bot/src/modules/tickets/confirm-flow.js";
import {
  canCloseTicket,
  canDeleteTicket,
} from "../bot/src/modules/tickets/permissions.js";
import { guardTicketThreadAction } from "../bot/src/modules/tickets/guards.js";
import { buildConfirmRow } from "../bot/src/lib/modules/tickets/panel.js";

function mockMember(opts: {
  userId?: string;
  admin?: boolean;
  roleIds?: string[];
}): GuildMember {
  const roleIds = new Set(opts.roleIds ?? []);
  return {
    id: opts.userId ?? "user-1",
    permissions: {
      has: (bit: bigint) =>
        opts.admin === true && bit === PermissionFlagsBits.Administrator,
    },
    roles: {
      cache: {
        has: (id: string) => roleIds.has(id),
      },
    },
  } as GuildMember;
}

describe("ticket custom ID parsers", () => {
  it("parses close button IDs", () => {
    expect(
      parseCloseCustomId(`${CLOSE_PREFIX}thread-1:support:opener-1`),
    ).toEqual({
      threadId: "thread-1",
      typeId: "support",
      openerUserId: "opener-1",
    });
  });

  it("parses close confirm IDs with opener user id", () => {
    expect(
      parseCloseCustomId(`${CLOSE_CONFIRM_PREFIX}thread-1:support:opener-1`),
    ).toEqual({
      threadId: "thread-1",
      typeId: "support",
      openerUserId: "opener-1",
    });
  });

  it("parses delete button and confirm IDs", () => {
    expect(parseDeleteCustomId(`${DELETE_PREFIX}thread-2:support`)).toEqual({
      threadId: "thread-2",
      typeId: "support",
    });
    expect(
      parseDeleteCustomId(`${DELETE_CONFIRM_PREFIX}thread-2:help:desk`),
    ).toEqual({
      threadId: "thread-2",
      typeId: "help:desk",
    });
  });

  it("rejects invalid custom IDs", () => {
    expect(parseCloseCustomId("tickets:open:support")).toBeNull();
    expect(parseDeleteCustomId("tickets:close:thread-1:support")).toBeNull();
  });
});

describe("ticket close/delete permissions", () => {
  it("allows opener to close their ticket", () => {
    const interaction = {
      user: { id: "opener-1" },
      member: mockMember({ roleIds: [] }),
    } as Parameters<typeof canCloseTicket>[0];

    expect(canCloseTicket(interaction, "opener-1", "staff-role")).toBe(true);
  });

  it("allows staff to close and delete", () => {
    const interaction = {
      user: { id: "user-2" },
      member: mockMember({ roleIds: ["staff-role"] }),
    } as Parameters<typeof canCloseTicket>[0];

    expect(canCloseTicket(interaction, "opener-1", "staff-role")).toBe(true);
    expect(canDeleteTicket(interaction, "staff-role")).toBe(true);
  });

  it("denies unrelated members", () => {
    const interaction = {
      user: { id: "user-3" },
      member: mockMember({ roleIds: [] }),
    } as Parameters<typeof canCloseTicket>[0];

    expect(canCloseTicket(interaction, "opener-1", "staff-role")).toBe(false);
    expect(canDeleteTicket(interaction, "staff-role")).toBe(false);
  });
});

describe("runTicketConfirmFlow", () => {
  it("prompts before confirm", async () => {
    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      deferred: false,
      replied: false,
      reply,
      followUp: vi.fn(),
    } as unknown as Parameters<typeof runTicketConfirmFlow>[0]["interaction"];

    const result = await runTicketConfirmFlow({
      interaction,
      isConfirm: false,
      confirmPrefix: CLOSE_CONFIRM_PREFIX,
      actionPayload: "thread-1:support",
      cancelCustomId: "tickets:close-cancel:thread-1",
      labels: {
        prompt: "Close?",
        yesLabel: "Yes",
        noLabel: "No",
      },
      buildConfirmRow,
      canPerform: () => true,
      deniedMessage: "Denied",
    });

    expect(result).toBe("prompted");
    expect(reply).toHaveBeenCalled();
  });

  it("denies when permission check fails", async () => {
    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      deferred: false,
      replied: false,
      reply,
      followUp: vi.fn(),
    } as unknown as Parameters<typeof runTicketConfirmFlow>[0]["interaction"];

    const result = await runTicketConfirmFlow({
      interaction,
      isConfirm: true,
      confirmPrefix: DELETE_CONFIRM_PREFIX,
      actionPayload: "thread-1:support",
      cancelCustomId: "tickets:delete-cancel:thread-1",
      labels: {
        prompt: "Delete?",
        yesLabel: "Yes",
        noLabel: "No",
      },
      buildConfirmRow,
      canPerform: () => false,
      deniedMessage: "Denied",
    });

    expect(result).toBe("denied");
    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Denied" }),
    );
  });
});

describe("guardTicketThreadAction", () => {
  it("rejects interactions outside the expected thread", async () => {
    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      customId: `${CLOSE_PREFIX}thread-1:support`,
      channel: {
        isThread: () => true,
        id: "other-thread",
        name: "Alice - 2026.01.01",
        locked: false,
      },
      deferred: false,
      replied: false,
      reply,
      followUp: vi.fn(),
    } as unknown as Parameters<typeof guardTicketThreadAction>[0];

    const result = await guardTicketThreadAction(
      interaction,
      "support",
      "thread-1",
    );

    expect(result.ok).toBe(false);
    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Invalid" }),
    );
  });
});
