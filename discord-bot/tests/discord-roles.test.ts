import {
  DiscordAPIError,
  PermissionFlagsBits,
  type GuildMember,
} from "discord.js";
import { describe, expect, it, vi } from "vitest";
import {
  roleChangeErrorMessage,
  tryAssignRole,
  tryRemoveRole,
} from "../bot/src/lib/core/discordRoles.js";

function fakeDiscordApiError(code: number): DiscordAPIError {
  const err = Object.create(DiscordAPIError.prototype) as DiscordAPIError;
  err.code = code;
  err.message = "api error";
  return err;
}

function mockMember(opts: {
  roleId: string;
  hasRole?: boolean;
  rolePosition?: number;
  botHighestPosition?: number;
  managed?: boolean;
  manageRoles?: boolean;
  isEveryoneRole?: boolean;
  addError?: unknown;
  removeError?: unknown;
}): GuildMember {
  const role = {
    id: opts.roleId,
    managed: opts.managed ?? false,
    position: opts.rolePosition ?? 1,
  };
  const rolesAdd = vi.fn().mockResolvedValue(undefined);
  const rolesRemove = vi.fn().mockResolvedValue(undefined);
  if (opts.addError) rolesAdd.mockRejectedValue(opts.addError);
  if (opts.removeError) rolesRemove.mockRejectedValue(opts.removeError);

  const guildId = opts.isEveryoneRole ? opts.roleId : "guild-1";

  return {
    id: "user-1",
    guild: {
      id: guildId,
      roles: {
        cache: {
          get: (id: string) => {
            if (id === opts.roleId) return role;
            return undefined;
          },
        },
      },
      members: {
        me: {
          permissions: {
            has: (flag: bigint) =>
              opts.manageRoles !== false &&
              flag === PermissionFlagsBits.ManageRoles,
          },
          roles: { highest: { position: opts.botHighestPosition ?? 10 } },
        },
      },
    },
    roles: {
      cache: {
        get: (id: string) => (id === opts.roleId ? role : undefined),
        has: (id: string) => id === opts.roleId && (opts.hasRole ?? false),
        keys: () => (opts.hasRole ? [opts.roleId] : []),
      },
      add: rolesAdd,
      remove: rolesRemove,
    },
  } as unknown as GuildMember;
}

describe("roleChangeErrorMessage", () => {
  it("returns hierarchy message for hierarchy failures", () => {
    expect(
      roleChangeErrorMessage(
        { ok: false, reason: "hierarchy" },
        "Hierarchy error",
        "Generic error",
      ),
    ).toBe("Hierarchy error");
  });

  it("returns generic message for other failures", () => {
    expect(
      roleChangeErrorMessage(
        { ok: false, reason: "permission" },
        "Hierarchy error",
        "Generic error",
      ),
    ).toBe("Generic error");
  });
});

describe("tryAssignRole", () => {
  it("returns missing when role is not in cache", async () => {
    const member = mockMember({ roleId: "role-1" });
    member.guild.roles.cache.get = () => undefined;
    const result = await tryAssignRole(member, "role-missing");
    expect(result).toEqual({ ok: false, reason: "missing" });
  });

  it("returns permission when bot lacks ManageRoles", async () => {
    const member = mockMember({ roleId: "role-1", manageRoles: false });
    const result = await tryAssignRole(member, "role-1");
    expect(result).toEqual({ ok: false, reason: "permission" });
  });

  it("returns managed for managed roles", async () => {
    const member = mockMember({ roleId: "role-1", managed: true });
    const result = await tryAssignRole(member, "role-1");
    expect(result).toEqual({ ok: false, reason: "managed" });
  });

  it("returns hierarchy when bot role is not high enough", async () => {
    const member = mockMember({
      roleId: "role-1",
      rolePosition: 20,
      botHighestPosition: 5,
    });
    const result = await tryAssignRole(member, "role-1");
    expect(result).toEqual({ ok: false, reason: "hierarchy" });
  });

  it("returns ok without API call when member already has role", async () => {
    const member = mockMember({ roleId: "role-1", hasRole: true });
    const result = await tryAssignRole(member, "role-1");
    expect(result).toEqual({ ok: true });
    expect(member.roles.add).not.toHaveBeenCalled();
  });

  it("assigns role when checks pass", async () => {
    const member = mockMember({ roleId: "role-1" });
    const result = await tryAssignRole(member, "role-1");
    expect(result).toEqual({ ok: true });
    expect(member.roles.add).toHaveBeenCalledWith("role-1");
  });

  it("maps Discord API permission errors", async () => {
    const member = mockMember({
      roleId: "role-1",
      addError: fakeDiscordApiError(50013),
    });
    const result = await tryAssignRole(member, "role-1");
    expect(result).toEqual({ ok: false, reason: "permission" });
  });
});

describe("tryRemoveRole", () => {
  it("returns ok without API call when member lacks role", async () => {
    const member = mockMember({ roleId: "role-1", hasRole: false });
    const result = await tryRemoveRole(member, "role-1");
    expect(result).toEqual({ ok: true });
    expect(member.roles.remove).not.toHaveBeenCalled();
  });

  it("removes role when checks pass", async () => {
    const member = mockMember({ roleId: "role-1", hasRole: true });
    const result = await tryRemoveRole(member, "role-1");
    expect(result).toEqual({ ok: true });
    expect(member.roles.remove).toHaveBeenCalledWith("role-1");
  });

  it("maps missing-role API errors", async () => {
    const member = mockMember({
      roleId: "role-1",
      hasRole: true,
      removeError: fakeDiscordApiError(10011),
    });
    const result = await tryRemoveRole(member, "role-1");
    expect(result).toEqual({ ok: false, reason: "missing" });
  });
});
