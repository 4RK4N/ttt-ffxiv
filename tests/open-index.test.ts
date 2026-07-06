import { describe, expect, it, beforeEach } from "vitest";
import {
  clearOpenTicket,
  lookupOpenTicketThreadId,
  registerOpenTicket,
  resetOpenTicketIndexForTests,
} from "../bot/src/modules/tickets/open-index.js";

describe("open ticket index", () => {
  beforeEach(() => {
    resetOpenTicketIndexForTests();
  });

  it("registers and looks up open tickets", () => {
    registerOpenTicket("channel-1", "user-1", "thread-1");
    expect(lookupOpenTicketThreadId("channel-1", "user-1")).toBe("thread-1");
  });

  it("clears entries on close", () => {
    registerOpenTicket("channel-1", "user-1", "thread-1");
    clearOpenTicket("channel-1", "user-1");
    expect(lookupOpenTicketThreadId("channel-1", "user-1")).toBeUndefined();
  });
});
