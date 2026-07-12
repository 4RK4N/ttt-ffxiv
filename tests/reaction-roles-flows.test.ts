import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { parseButtonCustomId } from "../bot/src/modules/reaction-roles/parsers.js";
import { isActivePanelMessage } from "../bot/src/modules/reaction-roles/guards.js";
import {
  isOnCooldown,
  touchCooldown,
} from "../bot/src/modules/reaction-roles/cooldown.js";
import {
  formatEphemeralMessage,
  replyRoleResult,
} from "../bot/src/modules/reaction-roles/respond.js";
import { BTN_PREFIX } from "../bot/src/lib/modules/reaction-roles/panel.js";
import type { ResolvedRolePanel } from "../shared/modules/reaction-roles/types.js";

function basePanel(
  overrides: Partial<ResolvedRolePanel> = {},
): ResolvedRolePanel {
  return {
    id: "roles",
    published: true,
    panelMessageId: "msg-1",
    channelId: "chan-1",
    reactionType: "button",
    toggleable: true,
    roleOptions: [
      {
        id: "member",
        roleId: "111111111111111111",
        emoji: "",
        label: "Member",
      },
    ],
    panelTitle: "Roles",
    panelDescription: "Pick a role",
    ephemeralMessage: "Granted {role} to {mention}",
    ...overrides,
  };
}

describe("parseButtonCustomId", () => {
  it("parses panel and option IDs", () => {
    expect(parseButtonCustomId(`${BTN_PREFIX}my-panel:member`)).toEqual({
      panelId: "my-panel",
      optionId: "member",
    });
  });

  it("supports panel IDs containing colons", () => {
    expect(
      parseButtonCustomId(`${BTN_PREFIX}panel:with:colons:member`),
    ).toEqual({
      panelId: "panel:with:colons",
      optionId: "member",
    });
  });

  it("rejects invalid IDs", () => {
    expect(parseButtonCustomId("reaction-roles:select:panel")).toBeNull();
    expect(parseButtonCustomId(`${BTN_PREFIX}onlypanel`)).toBeNull();
  });
});

describe("isActivePanelMessage", () => {
  it("matches published panel message and channel", () => {
    expect(isActivePanelMessage(basePanel(), "chan-1", "msg-1")).toBe(true);
  });

  it("rejects stale or mismatched messages", () => {
    expect(isActivePanelMessage(basePanel(), "chan-1", "msg-2")).toBe(false);
    expect(isActivePanelMessage(basePanel(), "other", "msg-1")).toBe(false);
    expect(
      isActivePanelMessage(
        basePanel({ panelMessageId: "" }),
        "chan-1",
        "msg-1",
      ),
    ).toBe(false);
  });
});

describe("reaction role cooldown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks repeat actions within the cooldown window", () => {
    touchCooldown("user-1", "panel-1");
    expect(isOnCooldown("user-1", "panel-1")).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(isOnCooldown("user-1", "panel-1")).toBe(false);
  });
});

describe("formatEphemeralMessage", () => {
  it("formats configured success copy", () => {
    expect(
      formatEphemeralMessage(basePanel(), {
        mention: "<@1>",
        role: "Member",
      }),
    ).toBe("Granted Member to <@1>");
  });

  it("returns undefined when template is blank", () => {
    expect(
      formatEphemeralMessage(basePanel({ ephemeralMessage: "  " }), {
        mention: "<@1>",
        role: "Member",
      }),
    ).toBeUndefined();
  });
});

describe("replyRoleResult", () => {
  it("returns true on success", async () => {
    const interaction = {
      deferred: false,
      replied: false,
      reply: vi.fn(),
      followUp: vi.fn(),
    } as unknown as Parameters<typeof replyRoleResult>[0];

    const ok = await replyRoleResult(
      interaction,
      { ok: true },
      { roleError: "Error", roleHierarchyError: "Hierarchy" },
    );

    expect(ok).toBe(true);
  });

  it("replies with hierarchy error on failure", async () => {
    const reply = vi.fn().mockResolvedValue(undefined);
    const interaction = {
      deferred: false,
      replied: false,
      reply,
      followUp: vi.fn(),
    } as unknown as Parameters<typeof replyRoleResult>[0];

    const ok = await replyRoleResult(
      interaction,
      { ok: false, reason: "hierarchy" },
      { roleError: "Error", roleHierarchyError: "Hierarchy" },
    );

    expect(ok).toBe(false);
    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Hierarchy" }),
    );
  });
});
