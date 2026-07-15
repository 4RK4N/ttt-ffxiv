import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { connect } from "@tursodatabase/database";
import { APP_CONFIG_SECRET_KEYS } from "@shared/config.js";
import {
  closeDb,
  getDb,
  initDb,
  loadDbBootstrapConfig,
} from "@shared/core/db.js";
import { setDbDataMany } from "@shared/core/dbData.js";
import {
  APP_CONFIG_TABLE,
  MODULE_NAMESPACES,
  moduleTableName,
} from "@shared/core/moduleTable.js";

/** Escape a string as a single-quoted SQL literal (`''` for embedded quotes). */
function sqlStringLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function usage(): never {
  console.error(`Usage: db/cli.ts <command>

Commands:
  write-app-config                    Write app_config from TTT_* environment variables
  apply-sql <db-path> <file>          Apply a SQL file to a Turso database
  count-app-config <db-path>          Print app_config row count (stdout)
  table-counts <db-path>              Print row counts for app_config and module tables
  dump-db [--include-secrets] <db-path>   Dump database as INSERT statements to stdout
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
    webPort: optionalPort("TTT_WEB_PORT", 8088),
  };
  if (guildId) config.guildId = guildId;
  return config;
}

async function writeAppConfigFromEnv(): Promise<void> {
  await initDb(loadDbBootstrapConfig());
  try {
    await setDbDataMany(APP_CONFIG_TABLE, buildAppConfigFromEnv());
  } finally {
    await closeDb();
  }
}

async function applySqlFile(dbPath: string, sqlFile: string): Promise<void> {
  const resolvedDb = path.resolve(dbPath);
  const sql = readFileSync(path.resolve(sqlFile), "utf8");
  await initDb({ dbPath: resolvedDb });
  try {
    await getDb().exec(sql);
    console.log(`[apply-sql] Applied ${sqlFile} → ${resolvedDb}`);
  } finally {
    await closeDb();
  }
}

async function countAppConfig(dbPath: string): Promise<void> {
  await initDb({ dbPath: path.resolve(dbPath) });
  try {
    const stmt = await getDb().prepare(
      `SELECT COUNT(*) AS count FROM ${APP_CONFIG_TABLE}`,
    );
    const row = (await stmt.get()) as { count: number };
    console.log(row.count);
  } finally {
    await closeDb();
  }
}

async function tableCounts(dbPath: string): Promise<void> {
  await initDb({ dbPath: path.resolve(dbPath) });
  try {
    const db = getDb();
    const tables = [APP_CONFIG_TABLE, ...MODULE_NAMESPACES.map(moduleTableName)];
    for (const table of tables) {
      const stmt = await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`);
      const row = (await stmt.get()) as { count: number };
      console.log(`${table}: ${row.count}`);
    }
  } finally {
    await closeDb();
  }
}

async function dumpDb(dbPath: string, includeSecrets: boolean): Promise<void> {
  const resolved = path.resolve(dbPath);
  const db = await connect(resolved, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    const schemaStmt = await db.prepare(
      `SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
    );
    const tables = (await schemaStmt.all()) as Array<{
      name: string;
      sql: string | null;
    }>;

    const lines: string[] = [
      `-- Turso dump of ${resolved}`,
      `-- Generated at ${new Date().toISOString()}`,
      includeSecrets
        ? "-- WARNING: contains app_config secrets (generated with --include-secrets)."
        : "-- app_config secret keys are redacted; use --include-secrets for full backup.",
      "",
    ];

    for (const { name, sql } of tables) {
      if (sql?.trim()) {
        lines.push(sql.trim().endsWith(";") ? sql.trim() : `${sql.trim()};`);
        lines.push("");
      }

      const rowStmt = await db.prepare(
        `SELECT key, value FROM ${name} ORDER BY key`,
      );
      const rows = (await rowStmt.all()) as Array<{
        key: string;
        value: string;
      }>;
      for (const row of rows) {
        let value = String(row.value);
        if (
          !includeSecrets &&
          name === APP_CONFIG_TABLE &&
          APP_CONFIG_SECRET_KEYS.has(row.key)
        ) {
          value = "-- REDACTED --";
        }
        lines.push(
          `INSERT INTO ${name}(key,value) VALUES(${sqlStringLiteral(row.key)},${sqlStringLiteral(value)}) ` +
          `ON CONFLICT(key) DO UPDATE SET value=excluded.value;`,
        );
      }
      if (rows.length > 0) lines.push("");
    }

    process.stdout.write(`${lines.join("\n")}\n`);
  } finally {
    await db.close();
  }
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) usage();

  switch (command) {
    case "write-app-config":
      await writeAppConfigFromEnv();
      return;
    case "apply-sql": {
      const dbPath = rest[0];
      const sqlFile = rest[1];
      if (!dbPath || !sqlFile) {
        console.error("Usage: db/cli.ts apply-sql <db-path> <file.sql>");
        process.exit(1);
      }
      await applySqlFile(dbPath, sqlFile);
      return;
    }
    case "count-app-config": {
      const dbPath = rest[0];
      if (!dbPath) {
        console.error("Usage: db/cli.ts count-app-config <db-path>");
        process.exit(1);
      }
      await countAppConfig(dbPath);
      return;
    }
    case "table-counts": {
      const dbPath = rest[0];
      if (!dbPath) {
        console.error("Usage: db/cli.ts table-counts <db-path>");
        process.exit(1);
      }
      await tableCounts(dbPath);
      return;
    }
    case "dump-db": {
      let includeSecrets = false;
      const args = [...rest];
      if (args[0] === "--include-secrets") {
        includeSecrets = true;
        args.shift();
      }
      const dbPath = args[0];
      if (!dbPath) {
        console.error("Usage: db/cli.ts dump-db [--include-secrets] <db-path>");
        process.exit(1);
      }
      await dumpDb(dbPath, includeSecrets);
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
