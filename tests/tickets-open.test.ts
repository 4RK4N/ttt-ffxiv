import { describe, expect, it, vi, beforeEach } from "vitest";
import { MessageFlags } from "discord.js";

const isModuleEnabled = vi.fn(() => true);

vi.mock("@shared/core/texts.js", () => ({
  format: (template: string, vars: Record<string, string>) =>
    template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? ""),
  isModuleEnabled: (...args: unknown[]) => isModuleEnabled(...args),
}));

vi.mock("../bot/src/lib/modules/tickets/config-io.js", () => ({
  NAMESPACE: "tickets",
  data: () => ({
    disabled: "Disabled",
    categoryUnpublished: "Unpublished",
    channelNotConfigured: "No channel",
    openInProgress: "In progress",
    openError: "Open error",
    invalidChannel: "Invalid channel",
    welcomeText: "Welcome {mention}",
  }),
  resolveTicketType: (id: string) =>
    id === "support"
      ? {
          id: "support",
          published: true,
          channelId: "chan-1",
          staffRoleId: "role-1",
          deniedRoleIds: [],
          openButtonLabel: "Open",
          closeButtonLabel: "Close",
          emoji: "",
          panelTitle: "Support",
          panelDescription: "Help",
          roleDenied: "Denied",
          alreadyOpen: "Already open {thread}",
        }
      : null,
}));

import { handleOpenTicket } from "../bot/src/modules/tickets/open.js";

function mockOpenInteraction(customId: string) {
  const deferReply = vi.fn().mockResolvedValue(undefined);
  const editReply = vi.fn().mockResolvedValue(undefined);

  return {
    customId,
    user: { id: "user-1", username: "alice" },
    guildId: "guild-1",
    deferReply,
    editReply,
    member: {
      id: "user-1",
      displayName: "Alice",
      roles: { cache: { has: () => false } },
    },
    client: {
      channels: {
        fetch: vi.fn().mockResolvedValue({
          isTextBased: () => true,
          isDMBased: () => false,
          isThread: () => false,
          id: "chan-1",
          threads: { fetchActive: vi.fn(), cache: new Map() },
        }),
      },
    },
  } as unknown as Parameters<typeof handleOpenTicket>[0];
}

describe("handleOpenTicket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isModuleEnabled.mockReturnValue(true);
  });

  it("defers ephemeral then edits when ticket type is unknown", async () => {
    const interaction = mockOpenInteraction("tickets:open:missing");
    await handleOpenTicket(interaction);
    expect(interaction.deferReply).toHaveBeenCalledWith({
      flags: MessageFlags.Ephemeral,
    });
    expect(interaction.editReply).toHaveBeenCalledWith("Unpublished");
  });

  it("edits disabled message when module is off", async () => {
    isModuleEnabled.mockReturnValue(false);
    const interaction = mockOpenInteraction("tickets:open:support");
    await handleOpenTicket(interaction);
    expect(interaction.editReply).toHaveBeenCalledWith("Disabled");
  });
});
