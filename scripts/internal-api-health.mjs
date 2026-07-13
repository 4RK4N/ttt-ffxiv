import { readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

const configPath = path.join(process.cwd(), "data", "config.json");

function optionalString(value, fallback) {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return fallback;
}

function optionalPort(value, fallback) {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536
    ? parsed
    : fallback;
}

function loadBootstrap() {
  let raw;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (err) {
    throw new Error(
      `Could not read DB bootstrap config from "${configPath}": ${err.message}`,
    );
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error(`"${configPath}" must be a JSON object.`);
  }
  return {
    host: optionalString(raw.dbHost, "ttt-postgres"),
    port: optionalPort(raw.dbPort, 5432),
    user: optionalString(raw.dbUser, "ttt"),
    database: optionalString(raw.dbName, "ttt"),
  };
}

async function loadAppConfig(pool) {
  const result = await pool.query(
    "SELECT key, value FROM app_config WHERE key IN ('internalApiPort', 'internalApiSecret')",
  );
  const rows = Object.fromEntries(
    result.rows.map((row) => [row.key, row.value]),
  );
  const port =
    typeof rows.internalApiPort === "number" ? rows.internalApiPort : 8087;
  const secret =
    typeof rows.internalApiSecret === "string"
      ? rows.internalApiSecret.trim()
      : "";
  return { port, secret };
}

const bootstrap = loadBootstrap();
const pool = new pg.Pool(bootstrap);

try {
  const { port, secret } = await loadAppConfig(pool);
  if (!secret) {
    console.error(
      "[healthcheck] internalApiSecret is not set in app_config.",
    );
    process.exit(1);
  }

  const res = await fetch(`http://127.0.0.1:${port}/internal/health`, {
    headers: { "X-Internal-Token": secret },
  });

  if (!res.ok) {
    console.error(`[healthcheck] HTTP ${res.status}.`);
    process.exit(1);
  }

  const body = await res.json();
  process.exit(body.ok === true ? 0 : 1);
} catch (err) {
  console.error("[healthcheck] Failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
