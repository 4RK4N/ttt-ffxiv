import { describe, expect, it } from "vitest";
import type { Attachment, Collection, Message } from "discord.js";
import { messageQualifiesForAutoThread } from "../bot/src/modules/links-pics-vids-autothread/handlers.js";
import { deleteNonQualifyingMessagesEnabled } from "../bot/src/lib/modules/links-pics-vids-autothread/config-io.js";

function mockMessage(
  content: string,
  attachments: { contentType?: string }[] = [],
): Message {
  const attachmentValues = attachments.map(
    (attachment) =>
      ({
        contentType: attachment.contentType,
      }) as Attachment,
  );

  return {
    content,
    attachments: {
      some: (fn: (attachment: Attachment) => boolean) =>
        attachmentValues.some(fn),
    } as unknown as Collection<string, Attachment>,
  } as Message;
}

describe("messageQualifiesForAutoThread", () => {
  it("returns false for plain text", () => {
    expect(messageQualifiesForAutoThread(mockMessage("hello"))).toBe(false);
  });

  it("returns false for unsupported links", () => {
    expect(
      messageQualifiesForAutoThread(
        mockMessage("https://www.youtube.com/watch?v=abc"),
      ),
    ).toBe(false);
  });

  it("returns true for supported social links", () => {
    expect(
      messageQualifiesForAutoThread(
        mockMessage("https://x.com/user/status/1234567890"),
      ),
    ).toBe(true);
  });

  it("returns true for image attachments", () => {
    expect(
      messageQualifiesForAutoThread(
        mockMessage("", [{ contentType: "image/png" }]),
      ),
    ).toBe(true);
  });

  it("returns true for video attachments", () => {
    expect(
      messageQualifiesForAutoThread(
        mockMessage("", [{ contentType: "video/mp4" }]),
      ),
    ).toBe(true);
  });

  it("returns false for non-media attachments only", () => {
    expect(
      messageQualifiesForAutoThread(
        mockMessage("", [{ contentType: "application/pdf" }]),
      ),
    ).toBe(false);
  });
});

describe("deleteNonQualifyingMessagesEnabled", () => {
  it("is off unless explicitly true", () => {
    expect(deleteNonQualifyingMessagesEnabled({ channelIds: [] })).toBe(false);
    expect(
      deleteNonQualifyingMessagesEnabled({
        channelIds: [],
        deleteNonQualifyingMessages: false,
      }),
    ).toBe(false);
    expect(
      deleteNonQualifyingMessagesEnabled({
        channelIds: [],
        deleteNonQualifyingMessages: true,
      }),
    ).toBe(true);
  });
});
