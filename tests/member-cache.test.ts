import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../bot/src/lib/core/memberDisplayNames.js", () => ({
  setMemberDisplayName: vi.fn(),
  removeMemberDisplayName: vi.fn(),
}));

import {
  setMemberDisplayName,
  removeMemberDisplayName,
} from "../bot/src/lib/core/memberDisplayNames.js";
import {
  getMembersForGuild,
  removeMember,
  upsertApiMember,
  upsertGuildMember,
} from "../bot/src/modules/tickets/member-cache.js";

const GUILD_ID = "guild-test";

function mockGuildMember(
  id: string,
  displayName: string,
  roleIds: string[],
  isBot = false,
) {
  return {
    id,
    displayName,
    user: { bot: isBot },
    guild: { id: GUILD_ID },
    roles: { cache: { keys: () => roleIds } },
  };
}

describe("member-cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    removeMember(GUILD_ID, "stale-user");
    getMembersForGuild(GUILD_ID).clear();
  });

  it("upserts guild members and exposes them via getMembersForGuild", () => {
    upsertGuildMember(
      mockGuildMember("user-1", "Alice", ["role-a"]) as Parameters<
        typeof upsertGuildMember
      >[0],
    );

    const map = getMembersForGuild(GUILD_ID);
    expect(map.get("user-1")).toEqual({
      roleIds: ["role-a"],
      isBot: false,
      displayName: "Alice",
    });
    expect(setMemberDisplayName).toHaveBeenCalledWith(
      GUILD_ID,
      "user-1",
      "Alice",
    );
  });

  it("removes members from cache", () => {
    upsertGuildMember(
      mockGuildMember("user-2", "Bob", []) as Parameters<
        typeof upsertGuildMember
      >[0],
    );
    removeMember(GUILD_ID, "user-2");

    expect(getMembersForGuild(GUILD_ID).has("user-2")).toBe(false);
    expect(removeMemberDisplayName).toHaveBeenCalledWith(GUILD_ID, "user-2");
  });

  it("upserts API member payloads using nick then global_name", () => {
    upsertApiMember(GUILD_ID, {
      user: { id: "user-3", bot: false, username: "plain", global_name: "Global" },
      nick: "Nick",
      roles: ["role-b"],
    });

    expect(getMembersForGuild(GUILD_ID).get("user-3")).toEqual({
      roleIds: ["role-b"],
      isBot: false,
      displayName: "Nick",
    });
  });

  it("falls back to username when API member has no nick or global_name", () => {
    upsertApiMember(GUILD_ID, {
      user: { id: "user-4", bot: true, username: "botname" },
      roles: [],
    });

    expect(getMembersForGuild(GUILD_ID).get("user-4")).toEqual({
      roleIds: [],
      isBot: true,
      displayName: "botname",
    });
  });

  it("ignores API payloads without a user id", () => {
    upsertApiMember(GUILD_ID, { user: undefined, roles: ["role-x"] });
    expect(getMembersForGuild(GUILD_ID).size).toBe(0);
  });
});
