import { describe, expect, it } from "vitest";
import { validateRolePanel } from "../shared/modules/reaction-roles/validate.js";
import type { ResolvedRolePanel } from "../shared/modules/reaction-roles/types.js";

function basePanel(
  overrides: Partial<ResolvedRolePanel> = {},
): ResolvedRolePanel {
  return {
    id: "roles",
    published: true,
    panelMessageId: "",
    channelId: "123456789012345678",
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
    ephemeralMessage: "",
    ...overrides,
  };
}

describe("validateRolePanel", () => {
  it("accepts a complete button panel", () => {
    expect(() => validateRolePanel(basePanel())).not.toThrow();
  });

  it("requires at least one role option", () => {
    expect(() => validateRolePanel(basePanel({ roleOptions: [] }))).toThrow(
      /1–/,
    );
  });

  it("requires emoji and role in emoji mode", () => {
    expect(() =>
      validateRolePanel(
        basePanel({
          reactionType: "emoji",
          roleOptions: [{ id: "a", roleId: "", emoji: "🎉", label: "Party" }],
        }),
      ),
    ).toThrow(/role is required/i);
  });

  it("rejects duplicate emojis in emoji mode", () => {
    expect(() =>
      validateRolePanel(
        basePanel({
          reactionType: "emoji",
          roleOptions: [
            {
              id: "a",
              roleId: "111111111111111111",
              emoji: "🎉",
              label: "A",
            },
            {
              id: "b",
              roleId: "222222222222222222",
              emoji: "🎉",
              label: "B",
            },
          ],
        }),
      ),
    ).toThrow(/duplicate emoji/i);
  });
});
