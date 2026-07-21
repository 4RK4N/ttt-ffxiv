import { PermissionFlagsBits } from "discord.js";
import { describe, expect, it } from "vitest";
import { canConfiguredRoleOrAdmin } from "../bot/src/lib/core/discordInteractions.js";

function mockMember(opts: { admin?: boolean; roleIds?: string[] }) {
  const roleIds = new Set(opts.roleIds ?? []);
  return {
    permissions: {
      has: (bit: bigint) =>
        opts.admin === true && bit === PermissionFlagsBits.Administrator,
    },
    roles: {
      cache: {
        has: (id: string) => roleIds.has(id),
      },
    },
  } as Parameters<typeof canConfiguredRoleOrAdmin>[0];
}

describe("canConfiguredRoleOrAdmin", () => {
  it("allows administrators without configured role", () => {
    expect(canConfiguredRoleOrAdmin(mockMember({ admin: true }), "")).toBe(
      true,
    );
  });

  it("allows members with the configured role", () => {
    expect(
      canConfiguredRoleOrAdmin(
        mockMember({ roleIds: ["111111111111111111"] }),
        "111111111111111111",
      ),
    ).toBe(true);
  });

  it("denies members without role when not admin", () => {
    expect(
      canConfiguredRoleOrAdmin(
        mockMember({ roleIds: ["222222222222222222"] }),
        "111111111111111111",
      ),
    ).toBe(false);
  });

  it("denies when configured role is empty and member is not admin", () => {
    expect(canConfiguredRoleOrAdmin(mockMember({}), "")).toBe(false);
  });
});
