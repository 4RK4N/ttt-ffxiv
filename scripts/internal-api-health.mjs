import { readFileSync } from "node:fs";
import path from "node:path";

const configPath = path.join(process.cwd(), "data", "config.json");

function loadConfig() {
  return JSON.parse(readFileSync(configPath, "utf8"));
}

const cfg = loadConfig();
const port = cfg.internalApiPort ?? 8087;
const secret =
  typeof cfg.internalApiSecret === "string" ? cfg.internalApiSecret.trim() : "";

if (!secret) {
  console.error("[healthcheck] internalApiSecret is not set.");
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
