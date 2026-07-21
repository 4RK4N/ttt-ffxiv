import { describe, expect, it } from "vitest";
import { normalizeRoleOptions } from "../shared/modules/reaction-roles/types.js";

describe("normalizeRoleOptions", () => {
  it("keeps complete options", () => {
    expect(
      normalizeRoleOptions([
        { id: "a", roleId: "1", emoji: "😀", label: "A" },
        { id: "b", roleId: "2", emoji: "", label: "B" },
      ]),
    ).toEqual([
      { id: "a", roleId: "1", emoji: "😀", label: "A" },
      { id: "b", roleId: "2", emoji: "", label: "B" },
    ]);
  });

  it("drops incomplete options", () => {
    expect(
      normalizeRoleOptions([
        { id: "only-id" },
        { id: "no-label", roleId: "1", emoji: "" },
        null,
        "x",
        { id: "ok", roleId: "1", emoji: "", label: "Ok" },
      ]),
    ).toEqual([{ id: "ok", roleId: "1", emoji: "", label: "Ok" }]);
  });

  it("returns empty array for non-arrays", () => {
    expect(normalizeRoleOptions(undefined)).toEqual([]);
    expect(normalizeRoleOptions({})).toEqual([]);
  });
});
