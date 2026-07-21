import { describe, expect, it, vi } from "vitest";
import type { Context } from "hono";

vi.mock("hono/cookie", () => ({
  getSignedCookie: vi.fn(),
}));

import { getSignedCookie } from "hono/cookie";
import { getCsrfToken, verifyFormCsrf } from "../web-admin/src/auth.js";

const cfg = { sessionSecret: "test-secret" } as Parameters<
  typeof verifyFormCsrf
>[1];

describe("verifyFormCsrf", () => {
  it("returns true when form token matches signed cookie", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue("token-a");
    const result = await verifyFormCsrf({} as Context, cfg, "token-a");
    expect(result).toBe(true);
  });

  it("returns false when tokens differ", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue("token-b");
    const result = await verifyFormCsrf({} as Context, cfg, "token-a");
    expect(result).toBe(false);
  });

  it("returns false when form token is empty", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue("token-a");
    const result = await verifyFormCsrf({} as Context, cfg, "");
    expect(result).toBe(false);
  });
});

describe("getCsrfToken", () => {
  it("returns null when cookie is missing", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue(undefined);
    const result = await getCsrfToken({} as Context, cfg);
    expect(result).toBeNull();
  });

  it("returns the cookie value when present", async () => {
    vi.mocked(getSignedCookie).mockResolvedValue("csrf-token");
    const result = await getCsrfToken({} as Context, cfg);
    expect(result).toBe("csrf-token");
  });
});
