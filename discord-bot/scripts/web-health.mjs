import { readFileSync } from "node:fs";
import path from "node:path";
import { connect } from "@tursodatabase/database";

const configPath = path.join(process.cwd(), "data", "config.json");

function loadDbPath() {
  let raw;
  try {
    raw = JSON.parse(readFileSync(configPath, "utf8"));
  } catch (err) {
    throw new Error(
      `Could not read DB bootstrap config from "${configPath}": ${err.message}`,
    );
  }
  const dbPath =
    typeof raw.dbPath === "string" && raw.dbPath.trim() !== ""
      ? raw.dbPath.trim()
      : "data/ttt.db";
  return path.isAbsolute(dbPath) ? dbPath : path.resolve(dbPath);
}

function parseStoredValue(raw) {
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
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

const dbPath = loadDbPath();
const db = await connect(dbPath);

try {
  const stmt = await db.prepare(
    "SELECT value FROM app_config WHERE key = 'webPort'",
  );
  const row = await stmt.get();
  const port = optionalPort(parseStoredValue(row?.value), 8088);

  const res = await fetch(`http://127.0.0.1:${port}/health`);
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
  await db.close();
}
