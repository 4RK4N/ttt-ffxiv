import { existsSync } from "node:fs";
import path from "node:path";

/** `data/` at cwd (Docker) or parent (local `npm` from `discord-bot/`). */
export function resolveDataDir(): string {
  const cwdData = path.resolve(process.cwd(), "data");
  if (existsSync(path.join(cwdData, "config.json"))) return cwdData;
  const parentData = path.resolve(process.cwd(), "..", "data");
  if (existsSync(path.join(parentData, "config.json"))) return parentData;
  return cwdData;
}
