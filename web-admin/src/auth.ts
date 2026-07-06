import { randomBytes } from "node:crypto";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import type { WebConfig } from "./config.js";
import { DISCORD_API, discordBotFetch } from "../../shared/core/discordApi.js";

const AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const OAUTH_SCOPES = "identify guilds";

// Discord permission bit for Administrator.
const ADMINISTRATOR = 1n << 3n; // 0x8

const SESSION_COOKIE = "ttt_session";
const STATE_COOKIE = "ttt_oauth_state";
const CSRF_COOKIE = "ttt_csrf";
// Kept short on purpose: the session is only a convenience cache. Admin status is
// re-validated against Discord (via the bot token) on each request, so a stale
// session can't grant access for long even if this is lengthened.
const SESSION_MAX_AGE = 60 * 60 * 4; // 4 hours
const STATE_MAX_AGE = 60 * 10; // 10 minutes

// How long a positive admin re-check is trusted before we ask Discord again.
const ADMIN_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export interface SessionUser {
  id: string;
  username: string;
}

interface DiscordTokenResponse {
  access_token?: string;
  token_type?: string;
}

interface DiscordPartialGuild {
  id: string;
  name: string;
  owner?: boolean;
  // String in API v8+, number in older/unversioned responses.
  permissions?: string | number;
}

function cookieOptions(cfg: WebConfig, maxAge: number) {
  return {
    httpOnly: true,
    secure: cfg.secureCookies,
    sameSite: "Lax" as const,
    path: "/",
    maxAge,
  };
}

/** Builds the Discord authorize URL and stores a one-time state in a cookie. */
export async function startLogin(
  c: Context,
  cfg: WebConfig,
): Promise<Response> {
  const state = randomBytes(16).toString("hex");
  await setSignedCookie(
    c,
    STATE_COOKIE,
    state,
    cfg.sessionSecret,
    cookieOptions(cfg, STATE_MAX_AGE),
  );

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.oauthRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", OAUTH_SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "consent");

  return c.redirect(url.toString());
}

async function exchangeCode(
  cfg: WebConfig,
  code: string,
): Promise<string | null> {
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.oauthRedirectUri,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    console.warn(`[web/auth] Token exchange failed (HTTP ${res.status}).`);
    return null;
  }

  const data = (await res.json()) as DiscordTokenResponse;
  return data.access_token ?? null;
}

async function fetchUser(accessToken: string): Promise<SessionUser | null> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id?: string; username?: string };
  if (!data.id) return null;
  return { id: data.id, username: data.username ?? data.id };
}

/** Returns true if the user has Administrator on the configured guild. */
async function isGuildAdmin(
  accessToken: string,
  guildId: string,
): Promise<boolean> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    console.warn(
      `[web/auth] Could not fetch user guilds (HTTP ${res.status}).`,
    );
    return false;
  }

  const guilds = (await res.json()) as DiscordPartialGuild[];
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild) return false;

  // The guild owner implicitly has every permission.
  if (guild.owner === true) return true;

  if (guild.permissions === undefined || guild.permissions === null)
    return false;

  try {
    // BigInt accepts both the string (v8+) and number (legacy) forms.
    return (BigInt(guild.permissions) & ADMINISTRATOR) === ADMINISTRATOR;
  } catch {
    return false;
  }
}

interface DiscordGuild {
  owner_id?: string;
}

interface DiscordGuildMember {
  roles?: string[];
}

interface DiscordRole {
  id: string;
  permissions?: string | number;
}

// Per-user cache of positive bot-token admin re-checks only.
const adminCache = new Map<string, { at: number }>();

async function discordBotGet<T>(
  cfg: WebConfig,
  path: string,
): Promise<T | null> {
  const res = await discordBotFetch(cfg.botToken, path);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Discord API returned HTTP ${res.status} for ${path}.`);
  }
  return (await res.json()) as T;
}

function hasAdminPermission(permissions: string | number | undefined): boolean {
  if (permissions === undefined || permissions === null) return false;
  try {
    return (BigInt(permissions) & ADMINISTRATOR) === ADMINISTRATOR;
  } catch {
    return false;
  }
}

/**
 * Re-checks, using the bot token, whether `userId` still has Administrator on the
 * configured guild. Unlike the login-time `isGuildAdmin` (which uses the user's
 * OAuth token), this needs no stored user token and reflects live permissions.
 */
async function isGuildAdminViaBot(
  cfg: WebConfig,
  userId: string,
): Promise<boolean> {
  const member = await discordBotGet<DiscordGuildMember>(
    cfg,
    `/guilds/${cfg.guildId}/members/${userId}`,
  );
  if (!member) return false;

  const guild = await discordBotGet<DiscordGuild>(
    cfg,
    `/guilds/${cfg.guildId}`,
  );
  if (guild?.owner_id && guild.owner_id === userId) return true;

  const roles = await discordBotGet<DiscordRole[]>(
    cfg,
    `/guilds/${cfg.guildId}/roles`,
  );
  if (!Array.isArray(roles)) return false;

  const memberRoleIds = new Set(member.roles ?? []);
  memberRoleIds.add(cfg.guildId);

  return roles.some(
    (role) =>
      memberRoleIds.has(role.id) && hasAdminPermission(role.permissions),
  );
}

/** Cached positive admin checks only; demoted admins are re-checked every request. */
async function isStillAdmin(cfg: WebConfig, userId: string): Promise<boolean> {
  const cached = adminCache.get(userId);
  if (cached && Date.now() - cached.at < ADMIN_CACHE_TTL_MS) {
    return true;
  }

  try {
    const admin = await isGuildAdminViaBot(cfg, userId);
    if (admin) {
      adminCache.set(userId, { at: Date.now() });
    } else {
      adminCache.delete(userId);
    }
    return admin;
  } catch (err) {
    console.warn("[web/auth] Admin re-check failed.", err);
    return false;
  }
}

export interface CallbackResult {
  ok: boolean;
  status: number;
  user?: SessionUser;
  message?: string;
}

/**
 * Handles the OAuth2 redirect: verifies state, exchanges the code, checks guild
 * admin, and on success writes the session cookie. Returns a result the caller
 * turns into a redirect or an error page.
 */
export async function handleCallback(
  c: Context,
  cfg: WebConfig,
): Promise<CallbackResult> {
  const oauthError = c.req.query("error");
  if (oauthError === "access_denied") {
    return {
      ok: false,
      status: 400,
      message: "Login was cancelled. Try again when you are ready.",
    };
  }

  const code = c.req.query("code");
  const state = c.req.query("state");
  const expectedState = await getSignedCookie(
    c,
    cfg.sessionSecret,
    STATE_COOKIE,
  );
  deleteCookie(c, STATE_COOKIE, { path: "/" });

  if (!code || !state || !expectedState || state !== expectedState) {
    return {
      ok: false,
      status: 400,
      message: "Invalid or expired login attempt. Please try again.",
    };
  }

  const accessToken = await exchangeCode(cfg, code);
  if (!accessToken) {
    return {
      ok: false,
      status: 502,
      message: "Could not complete login with Discord.",
    };
  }

  const user = await fetchUser(accessToken);
  if (!user) {
    return {
      ok: false,
      status: 502,
      message: "Could not read your Discord account.",
    };
  }

  const admin = await isGuildAdmin(accessToken, cfg.guildId);
  if (!admin) {
    return {
      ok: false,
      status: 403,
      user,
      message:
        "You need the Administrator permission on this server to use the editor.",
    };
  }

  await setSignedCookie(
    c,
    SESSION_COOKIE,
    JSON.stringify(user),
    cfg.sessionSecret,
    cookieOptions(cfg, SESSION_MAX_AGE),
  );

  const csrfToken = randomBytes(32).toString("hex");
  await setSignedCookie(
    c,
    CSRF_COOKIE,
    csrfToken,
    cfg.sessionSecret,
    cookieOptions(cfg, SESSION_MAX_AGE),
  );

  return { ok: true, status: 200, user };
}

export function logout(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  deleteCookie(c, CSRF_COOKIE, { path: "/" });
}

/** Reads and verifies the session cookie, returning the user or null. */
export async function getSessionUser(
  c: Context,
  cfg: WebConfig,
): Promise<SessionUser | null> {
  const raw = await getSignedCookie(c, cfg.sessionSecret, SESSION_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (parsed && typeof parsed.id === "string") return parsed;
  } catch {
    // Tampered or malformed cookie.
  }
  return null;
}

function clearSessionCookies(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  deleteCookie(c, CSRF_COOKIE, { path: "/" });
}

/**
 * Session user who still has guild admin. Clears cookies when session exists
 * but admin was revoked.
 */
export async function getAuthorizedSessionUser(
  c: Context,
  cfg: WebConfig,
): Promise<SessionUser | null> {
  const user = await getSessionUser(c, cfg);
  if (!user) return null;
  if (!(await isStillAdmin(cfg, user.id))) {
    clearSessionCookies(c);
    return null;
  }
  return user;
}

/** CSRF token for double-submit validation (signed cookie, set on login). */
export async function getCsrfToken(
  c: Context,
  cfg: WebConfig,
): Promise<string | null> {
  const token = await getSignedCookie(c, cfg.sessionSecret, CSRF_COOKIE);
  return typeof token === "string" ? token : null;
}

/** Returns a CSRF token, minting a signed cookie when missing (e.g. pre-CSRF sessions). */
export async function ensureCsrfToken(
  c: Context,
  cfg: WebConfig,
): Promise<string> {
  const existing = await getCsrfToken(c, cfg);
  if (existing) return existing;

  const token = randomBytes(32).toString("hex");
  await setSignedCookie(
    c,
    CSRF_COOKIE,
    token,
    cfg.sessionSecret,
    cookieOptions(cfg, SESSION_MAX_AGE),
  );
  return token;
}

/**
 * Middleware that requires a valid session. API requests get a 401 JSON; page
 * requests are redirected to /login. The authenticated user is stored on the
 * context under "user".
 */
export function requireAuth(cfg: WebConfig): MiddlewareHandler {
  return async (c, next) => {
    const denied = () => {
      if (c.req.path.startsWith("/api/")) {
        return c.json({ error: "Unauthorized" }, 401);
      }
      return c.redirect("/login");
    };

    const user = await getAuthorizedSessionUser(c, cfg);
    if (!user) return denied();

    c.set("user", user);
    await next();
  };
}

/** Validates a CSRF token from a form field against the signed CSRF cookie. */
export async function verifyFormCsrf(
  c: Context,
  cfg: WebConfig,
  formToken: string,
): Promise<boolean> {
  const cookieToken = await getSignedCookie(c, cfg.sessionSecret, CSRF_COOKIE);
  return (
    typeof cookieToken === "string" &&
    formToken !== "" &&
    cookieToken === formToken
  );
}

/** Validates X-CSRF-Token header against the signed CSRF cookie on mutating requests. */
export function requireCsrf(cfg: WebConfig): MiddlewareHandler {
  return async (c, next) => {
    const method = c.req.method.toUpperCase();
    if (
      method !== "POST" &&
      method !== "PUT" &&
      method !== "PATCH" &&
      method !== "DELETE"
    ) {
      await next();
      return;
    }

    const cookieToken = await getSignedCookie(
      c,
      cfg.sessionSecret,
      CSRF_COOKIE,
    );
    const headerToken = c.req.header("X-CSRF-Token");
    if (
      typeof cookieToken !== "string" ||
      !headerToken ||
      cookieToken !== headerToken
    ) {
      return c.json({ error: "Invalid CSRF token." }, 403);
    }

    await next();
  };
}
