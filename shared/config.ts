import { initDb, loadDbBootstrapConfig } from "./core/db.js";
import { APP_CONFIG_TABLE } from "./core/moduleTable.js";
import { getDbDataAll } from "./core/dbData.js";

const CONFIG_FILE_KEYS = new Set(["dbPath", "_docker"]);

function trimmedOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

function optionalPort(value: unknown, fallback: number): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536
    ? parsed
    : fallback;
}

function requiredFromRows(rows: Record<string, unknown>, key: string): string {
  const value = trimmedOrUndefined(rows[key]);
  if (!value) {
    throw new Error(
      `Missing required app config "${key}" in database table "${APP_CONFIG_TABLE}". ` +
      "Run ./scripts/db/db-init.sh to populate app_config.",
    );
  }
  return value;
}

export interface Config {
  discordToken: string;
  clientId: string;
  guildId: string | undefined;
  botName: string;
  clientSecret: string | undefined;
  sessionSecret: string | undefined;
  oauthRedirectUri: string | undefined;
  webPort: number;
}

export let config: Config;

export async function initConfig(): Promise<void> {
  await initDb(loadDbBootstrapConfig());
  const rows = await getDbDataAll(APP_CONFIG_TABLE);
  config = {
    discordToken: requiredFromRows(rows, "discordToken"),
    clientId: requiredFromRows(rows, "clientId"),
    guildId: trimmedOrUndefined(rows.guildId),
    botName: trimmedOrUndefined(rows.botName) ?? "TTT",
    clientSecret: trimmedOrUndefined(rows.clientSecret),
    sessionSecret: trimmedOrUndefined(rows.sessionSecret),
    oauthRedirectUri: trimmedOrUndefined(rows.oauthRedirectUri),
    webPort: optionalPort(rows.webPort, 8088),
  };
}

export function isAppConfigDbKey(key: string): boolean {
  return CONFIG_FILE_KEYS.has(key);
}
