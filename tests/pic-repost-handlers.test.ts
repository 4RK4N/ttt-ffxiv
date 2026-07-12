import { MessageFlags } from "discord.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEXT_DEFAULTS } from "../bot/src/lib/modules/pic-repost-commands/types.js";
import { executePicRepost } from "../bot/src/modules/pic-repost-commands/handlers.js";
import { DISCORD_MESSAGE_CONTENT_MAX } from "../shared/core/limits.js";

vi.mock("../shared/core/texts.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../shared/core/texts.js")>();
  return {
    ...actual,
    isModuleEnabled: vi.fn(() => true),
  };
});

vi.mock("../bot/src/lib/modules/pic-repost-commands/config-io.js", () => ({
  NAMESPACE: "pic-repost-commands",
  config: () => ({ deleteEmoji: "🗑️" }),
  texts: () => TEXT_DEFAULTS,
  resolveDeleteEmoji: () => "🗑️",
}));

function mockInteraction(opts: {
  message?: string;
  attachments?: Array<{ name: string; contentType?: string; size: number }>;
}) {
  const deferReply = vi.fn().mockResolvedValue(undefined);
  const editReply = vi.fn().mockResolvedValue(undefined);
  let imageIndex = 0;
  const attachments = opts.attachments ?? [];

  return {
    deferReply,
    editReply,
    options: {
      getString: (key: string) =>
        key === "message" ? (opts.message ?? "hello") : null,
      getAttachment: (key: string) => {
        if (!key.startsWith("image")) return null;
        const attachment = attachments[imageIndex];
        imageIndex += 1;
        return attachment ?? null;
      },
    },
    member: null,
    user: { id: "user-1" },
    channel: { isSendable: () => true },
  } as unknown as Parameters<typeof executePicRepost>[0];
}

describe("executePicRepost validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defers ephemerally before validation", async () => {
    const interaction = mockInteraction({ attachments: [] });
    await executePicRepost(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith({
      flags: MessageFlags.Ephemeral,
    });
  });

  it("rejects when no images are attached", async () => {
    const interaction = mockInteraction({ attachments: [] });
    await executePicRepost(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith(TEXT_DEFAULTS.noImages);
  });

  it("rejects non-image attachments", async () => {
    const interaction = mockInteraction({
      attachments: [
        { name: "doc.pdf", contentType: "application/pdf", size: 1 },
      ],
    });
    await executePicRepost(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.stringContaining("doc.pdf"),
    );
  });

  it("rejects messages over Discord content limit", async () => {
    const interaction = mockInteraction({
      message: "x".repeat(DISCORD_MESSAGE_CONTENT_MAX + 1),
      attachments: [{ name: "a.png", contentType: "image/png", size: 1 }],
    });
    await executePicRepost(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith(
      TEXT_DEFAULTS.messageTooLong,
    );
  });
});
