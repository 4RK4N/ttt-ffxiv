import { Events, type Client } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { registerSafeHandler } from "../bot/src/lib/core/discordEvents.js";

describe("registerSafeHandler", () => {
  it("registers handlers and logs async failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const handlers = new Map<string, (...args: unknown[]) => void>();
    const client = {
      on: (event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(event, handler);
      },
    } as unknown as Client;

    registerSafeHandler(
      client,
      Events.ThreadDelete,
      async () => {
        throw new Error("boom");
      },
      "[test]",
    );

    const handler = handlers.get(Events.ThreadDelete);
    expect(handler).toBeTypeOf("function");
    handler?.({ id: "thread-1" });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalledWith(
      "[test] threadDelete handler error:",
      expect.any(Error),
    );

    errorSpy.mockRestore();
  });
});
