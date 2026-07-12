import { DiscordAPIError } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { DISCORD_EMOJI_MAX_BYTES } from "../shared/core/limits.js";
import { canEmojiOrAdmin } from "../bot/src/modules/emojis/permissions.js";
import {
  mapCreateError,
  validateName,
} from "../bot/src/modules/emojis/handlers.js";
import type { EmojisTexts } from "../bot/src/lib/modules/emojis/types.js";
import { TEXT_DEFAULTS } from "../bot/src/lib/modules/emojis/types.js";
import { roleChangeErrorMessage } from "../bot/src/lib/core/discordRoles.js";

const t: EmojisTexts = TEXT_DEFAULTS;

function fakeDiscordApiError(code: number, message = ""): DiscordAPIError {
  const err = Object.create(DiscordAPIError.prototype) as DiscordAPIError;
  err.code = code;
  err.message = message;
  return err;
}

function mockInteraction(opts: {
  names?: string[];
  editReply?: ReturnType<typeof vi.fn>;
}) {
  const editReply = opts.editReply ?? vi.fn().mockResolvedValue(undefined);
  const names = new Set(opts.names ?? []);
  return {
    editReply,
    guild: {
      emojis: {
        cache: {
          some: (fn: (emoji: { name: string }) => boolean) =>
            [...names].some((name) => fn({ name })),
        },
      },
    },
  } as unknown as Parameters<typeof validateName>[0];
}

describe("mapCreateError", () => {
  it("maps permission denied", () => {
    expect(mapCreateError(fakeDiscordApiError(50013))).toBe(
      "botMissingPermission",
    );
  });

  it("maps emoji slot limits", () => {
    expect(mapCreateError(fakeDiscordApiError(30008))).toBe("slotsFull");
    expect(mapCreateError(fakeDiscordApiError(30018))).toBe("slotsFull");
  });

  it("maps name-taken message", () => {
    expect(
      mapCreateError(
        fakeDiscordApiError(0, "Emoji with that name already exists"),
      ),
    ).toBe("nameTaken");
  });

  it("maps file-too-large message", () => {
    expect(
      mapCreateError(fakeDiscordApiError(0, "File cannot be larger than 256")),
    ).toBe("fileTooLarge");
  });

  it("falls back to createFailed", () => {
    expect(mapCreateError(new Error("unknown"))).toBe("createFailed");
  });
});

describe("validateName", () => {
  it("rejects invalid emoji names", async () => {
    const editReply = vi.fn().mockResolvedValue(undefined);
    const interaction = mockInteraction({ editReply });

    const ok = await validateName(interaction, t, "a");

    expect(ok).toBe(false);
    expect(editReply).toHaveBeenCalledWith(t.invalidName);
  });

  it("rejects duplicate names in guild cache", async () => {
    const editReply = vi.fn().mockResolvedValue(undefined);
    const interaction = mockInteraction({
      editReply,
      names: ["taken_emoji"],
    });

    const ok = await validateName(interaction, t, "taken_emoji");

    expect(ok).toBe(false);
    expect(editReply).toHaveBeenCalledWith(t.nameTaken);
  });

  it("accepts valid unused names", async () => {
    const interaction = mockInteraction({ names: ["other"] });

    const ok = await validateName(interaction, t, "new_emoji");

    expect(ok).toBe(true);
  });
});

describe("emoji size limit", () => {
  it("uses Discord 256 KiB cap", () => {
    expect(DISCORD_EMOJI_MAX_BYTES).toBe(256 * 1024);
  });
});

describe("emoji permission gate", () => {
  it("denies members without configured role", () => {
    const member = {
      permissions: { has: () => false },
      roles: { cache: { has: () => false } },
    } as Parameters<typeof canEmojiOrAdmin>[0];

    expect(canEmojiOrAdmin(member, "111111111111111111")).toBe(false);
  });
});

describe("roleChangeErrorMessage", () => {
  it("returns hierarchy message when reason is hierarchy", () => {
    expect(
      roleChangeErrorMessage(
        { ok: false, reason: "hierarchy" },
        "Hierarchy error",
        "Role error",
      ),
    ).toBe("Hierarchy error");
  });

  it("returns generic error for other failures", () => {
    expect(
      roleChangeErrorMessage(
        { ok: false, reason: "permission" },
        "Hierarchy error",
        "Role error",
      ),
    ).toBe("Role error");
  });
});
