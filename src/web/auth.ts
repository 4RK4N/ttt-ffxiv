import { randomBytes } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import type { WebConfig } from './config.js';

// Pin the API version. Unversioned requests can return the legacy shape where a
// guild's `permissions` is a number; v10 returns it as a string. We handle both
// below, but pinning keeps the response shape predictable.
const DISCORD_API = 'https://discord.com/api/v10';
const AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';
const OAUTH_SCOPES = 'identify guilds';

// Discord permission bit for Administrator.
const ADMINISTRATOR = 1n << 3n; // 0x8

const SESSION_COOKIE = 'ttt_session';
const STATE_COOKIE = 'ttt_oauth_state';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const STATE_MAX_AGE = 60 * 10; // 10 minutes

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
    sameSite: 'Lax' as const,
    path: '/',
    maxAge,
  };
}

/** Builds the Discord authorize URL and stores a one-time state in a cookie. */
export async function startLogin(c: Context, cfg: WebConfig): Promise<Response> {
  const state = randomBytes(16).toString('hex');
  await setSignedCookie(c, STATE_COOKIE, state, cfg.sessionSecret, cookieOptions(cfg, STATE_MAX_AGE));

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('client_id', cfg.clientId);
  url.searchParams.set('redirect_uri', cfg.oauthRedirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', OAUTH_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'consent');

  return c.redirect(url.toString());
}

async function exchangeCode(cfg: WebConfig, code: string): Promise<string | null> {
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: cfg.oauthRedirectUri,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
async function isGuildAdmin(accessToken: string, guildId: string): Promise<boolean> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    console.warn(`[web/auth] Could not fetch user guilds (HTTP ${res.status}).`);
    return false;
  }

  const guilds = (await res.json()) as DiscordPartialGuild[];
  const guild = guilds.find((g) => g.id === guildId);
  if (!guild) return false;

  // The guild owner implicitly has every permission.
  if (guild.owner === true) return true;

  if (guild.permissions === undefined || guild.permissions === null) return false;

  try {
    // BigInt accepts both the string (v8+) and number (legacy) forms.
    return (BigInt(guild.permissions) & ADMINISTRATOR) === ADMINISTRATOR;
  } catch {
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
export async function handleCallback(c: Context, cfg: WebConfig): Promise<CallbackResult> {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const expectedState = await getSignedCookie(c, cfg.sessionSecret, STATE_COOKIE);
  deleteCookie(c, STATE_COOKIE, { path: '/' });

  if (!code || !state || !expectedState || state !== expectedState) {
    return { ok: false, status: 400, message: 'Invalid or expired login attempt. Please try again.' };
  }

  const accessToken = await exchangeCode(cfg, code);
  if (!accessToken) {
    return { ok: false, status: 502, message: 'Could not complete login with Discord.' };
  }

  const user = await fetchUser(accessToken);
  if (!user) {
    return { ok: false, status: 502, message: 'Could not read your Discord account.' };
  }

  const admin = await isGuildAdmin(accessToken, cfg.guildId);
  if (!admin) {
    return {
      ok: false,
      status: 403,
      user,
      message: 'You need the Administrator permission on this server to use the editor.',
    };
  }

  await setSignedCookie(
    c,
    SESSION_COOKIE,
    JSON.stringify(user),
    cfg.sessionSecret,
    cookieOptions(cfg, SESSION_MAX_AGE)
  );

  return { ok: true, status: 200, user };
}

export function logout(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

/** Reads and verifies the session cookie, returning the user or null. */
export async function getSessionUser(c: Context, cfg: WebConfig): Promise<SessionUser | null> {
  const raw = await getSignedCookie(c, cfg.sessionSecret, SESSION_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    if (parsed && typeof parsed.id === 'string') return parsed;
  } catch {
    // Tampered or malformed cookie.
  }
  return null;
}

/**
 * Middleware that requires a valid session. API requests get a 401 JSON; page
 * requests are redirected to /login. The authenticated user is stored on the
 * context under "user".
 */
export function requireAuth(cfg: WebConfig): MiddlewareHandler {
  return async (c, next) => {
    const user = await getSessionUser(c, cfg);
    if (!user) {
      if (c.req.path.startsWith('/api/')) {
        return c.json({ error: 'Unauthorized' }, 401);
      }
      return c.redirect('/login');
    }
    c.set('user', user);
    await next();
  };
}
