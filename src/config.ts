import { readFileSync } from 'node:fs';
import path from 'node:path';

// data/config.json is the single source of truth for the bot's configuration.
// The data directory is resolved from the process working directory (or DATA_DIR)
// exactly like core/texts' DATA_DIR, so it's stable across `tsx` dev, compiled
// `dist/` prod, and Docker (where ./data is bind-mounted over the image).
const DATA_DIR = path.resolve(process.env.DATA_DIR ?? process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

interface RawConfig {
  discordToken?: string;
  clientId?: string;
  guildId?: string;
  botName?: string;
  clientSecret?: string;
  sessionSecret?: string;
  oauthRedirectUri?: string;
  webPort?: number | string;
}

function loadRaw(): RawConfig {
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as RawConfig;
  } catch (err) {
    throw new Error(
      `Could not read configuration from "${CONFIG_FILE}". ` +
      'Copy "data/config.example.json" to "data/config.json" and fill in the values. ' +
      `(${(err as Error).message})`
    );
  }
}

const raw = loadRaw();

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function required(key: keyof RawConfig): string {
  const value = str(raw[key]);
  if (!value) {
    throw new Error(
      `Missing required config value "${key}" in "${CONFIG_FILE}". ` +
      'See "data/config.example.json" for the expected shape.'
    );
  }
  return value;
}

function optionalPort(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : fallback;
}

export interface Config {
  discordToken: string;
  clientId: string;
  guildId: string | undefined;
  // Display name used in the web editor's title (e.g. "<botName> Admin Interface").
  botName: string;
  // Web editor settings. These are optional here so the bot process starts
  // without them; the web entrypoint validates the ones it needs (see web/config).
  clientSecret: string | undefined;
  sessionSecret: string | undefined;
  oauthRedirectUri: string | undefined;
  webPort: number;
}

export const config: Config = {
  discordToken: required('discordToken'),
  clientId: required('clientId'),
  // Optional: when set, slash commands register to this guild instantly (great for dev).
  guildId: str(raw.guildId),
  // Bot/display name shown in the web editor title; falls back to "TTT".
  botName: str(raw.botName) ?? 'TTT',
  // OAuth client secret used by the web editor to exchange the auth code.
  clientSecret: str(raw.clientSecret),
  // Secret used to sign the web editor's session cookies.
  sessionSecret: str(raw.sessionSecret),
  // Registered Discord OAuth2 redirect URI (must match the Developer Portal).
  oauthRedirectUri: str(raw.oauthRedirectUri),
  // Port the web editor listens on.
  webPort: optionalPort(raw.webPort, 8088),
};
