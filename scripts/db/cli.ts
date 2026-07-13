import { randomBytes } from "node:crypto";
import {
  closeDbPool,
  initDbPool,
  loadDbBootstrapConfig,
  withTransaction,
} from "../../shared/core/db.js";
import { setDbDataMany, tableIsEmpty } from "../../shared/core/dbData.js";
import {
  APP_CONFIG_TABLE,
  MODULE_NAMESPACES,
  moduleTableName,
  type ModuleNamespace,
} from "../../shared/core/moduleTable.js";
import { MODULE_SEED_DEFAULTS } from "./moduleSeedDefaults.js";

function usage(): never {
  console.error(`Usage: db/cli.ts <command>

Commands:
  write-app-config   Write app_config from TTT_* environment variables
  seed [--force]     Seed module_* tables from code defaults
`);
  process.exit(1);
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing required environment variable ${name}.`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function optionalPort(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536
    ? parsed
    : fallback;
}

function buildAppConfigFromEnv(): Record<string, unknown> {
  const guildId = process.env.TTT_GUILD_ID?.trim();
  const config: Record<string, unknown> = {
    discordToken: requiredEnv("TTT_DISCORD_TOKEN"),
    clientId: requiredEnv("TTT_CLIENT_ID"),
    botName: optionalEnv("TTT_BOT_NAME", "TTT"),
    clientSecret: requiredEnv("TTT_CLIENT_SECRET"),
    sessionSecret:
      process.env.TTT_SESSION_SECRET?.trim() || randomBytes(32).toString("hex"),
    oauthRedirectUri: requiredEnv("TTT_OAUTH_REDIRECT_URI"),
    internalApiSecret:
      process.env.TTT_INTERNAL_API_SECRET?.trim() ||
      randomBytes(32).toString("hex"),
    webPort: optionalPort("TTT_WEB_PORT", 8088),
    internalApiPort: optionalPort("TTT_INTERNAL_API_PORT", 8087),
    internalApiBind: optionalEnv("TTT_INTERNAL_API_BIND", "0.0.0.0"),
    botInternalApiUrl: optionalEnv(
      "TTT_BOT_INTERNAL_API_URL",
      "http://ttt-discord-bot:8087",
    ),
  };
  if (guildId) config.guildId = guildId;
  return config;
}

async function writeAppConfigFromEnv(): Promise<void> {
  initDbPool(loadDbBootstrapConfig());
  try {
    await setDbDataMany(APP_CONFIG_TABLE, buildAppConfigFromEnv());
  } finally {
    await closeDbPool();
  }
}

async function seedModuleTable(
  namespace: ModuleNamespace,
  force: boolean,
): Promise<number> {
  const table = moduleTableName(namespace);
  if (!(await tableIsEmpty(table)) && !force) {
    return 0;
  }

  const rows = MODULE_SEED_DEFAULTS[namespace];

  await withTransaction(async (client) => {
    if (force) {
      await client.query(`DELETE FROM ${table}`);
    }
    for (const [key, value] of Object.entries(rows)) {
      await client.query(
        `INSERT INTO ${table} (key, value, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    }
  });

  return Object.keys(rows).length;
}

async function seedModuleTables(force: boolean): Promise<void> {
  initDbPool(loadDbBootstrapConfig());
  try {
    for (const namespace of MODULE_NAMESPACES) {
      const count = await seedModuleTable(namespace, force);
      if (count > 0) {
        console.log(`[seed] ${moduleTableName(namespace)}: ${count} key(s)`);
      }
    }
  } finally {
    await closeDbPool();
  }
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) usage();

  switch (command) {
    case "write-app-config":
      await writeAppConfigFromEnv();
      return;
    case "seed": {
      const force = rest.includes("--force");
      await seedModuleTables(force);
      return;
    }
    default:
      console.error(`Unknown command: ${command}`);
      usage();
  }
}

main().catch((err) => {
  console.error("db/cli failed:", err);
  process.exit(1);
});
