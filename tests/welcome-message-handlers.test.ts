import { describe, expect, it, vi, beforeEach } from "vitest";
import { handleMemberAdd } from "../bot/src/modules/welcome-message/handlers.js";

const welcomeChannelId = vi.fn();
const texts = vi.fn();
const rulesChannelLink = vi.fn();

vi.mock("../bot/src/lib/modules/welcome-message/config-io.js", () => ({
  texts: () => texts(),
  welcomeChannelId: () => welcomeChannelId(),
  rulesChannelLink: (guildId: string) => rulesChannelLink(guildId),
}));

vi.mock("../bot/src/modules/welcome-message/card.js", () => ({
  renderWelcomeCard: vi.fn(),
}));

vi.mock("../bot/src/lib/core/discordDm.js", () => ({
  trySendDm: vi.fn().mockResolvedValue(undefined),
}));

function mockMember(channel: unknown) {
  return {
    id: "member-1",
    displayName: "Alice",
    displayAvatarURL: () => "https://cdn.discordapp.com/avatars/1.png",
    guild: { id: "guild-1" },
    user: { id: "member-1" },
    client: {
      channels: {
        fetch: vi.fn().mockResolvedValue(channel),
      },
    },
  } as unknown as Parameters<typeof handleMemberAdd>[0];
}

describe("handleMemberAdd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    texts.mockReturnValue({
      welcomeContent: "Welcome {mention}",
      rulesMessage: "Rules: {rulesChannel}",
      rulesChannelFallback: "{mention} see {rulesChannel}",
    });
    rulesChannelLink.mockReturnValue("<#rules>");
  });

  it("skips when welcome channel is not configured", async () => {
    welcomeChannelId.mockReturnValue(undefined);
    const member = mockMember(null);

    await handleMemberAdd(member);

    expect(member.client.channels.fetch).not.toHaveBeenCalled();
  });

  it("skips when welcome channel is not sendable", async () => {
    welcomeChannelId.mockReturnValue("channel-1");
    const member = mockMember({
      isTextBased: () => true,
      isSendable: () => false,
    });

    await handleMemberAdd(member);

    expect(member.client.channels.fetch).toHaveBeenCalledWith("channel-1");
  });
});
