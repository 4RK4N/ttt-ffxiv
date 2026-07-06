import { createHash, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { config } from "../../../shared/config.js";
import { getPublishHandlers } from "./publishRegistry.js";

const TOKEN_HEADER = "x-internal-token";

function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function readToken(req: IncomingMessage): string | undefined {
  const raw = req.headers[TOKEN_HEADER];
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0];
  return undefined;
}

/** Constant-time compare via SHA-256 digests (length-safe). */
function isValidInternalToken(
  provided: string | undefined,
  expected: string,
): boolean {
  const providedHash = createHash("sha256")
    .update(provided ?? "", "utf8")
    .digest();
  const expectedHash = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(providedHash, expectedHash);
}

function parsePath(url: string | undefined): string {
  if (!url) return "/";
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return "/";
  }
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const path = parsePath(req.url);
  const method = req.method ?? "GET";

  if (path === "/internal/health" && method === "GET") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (!path.startsWith("/internal/")) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  const secret = config.internalApiSecret;
  if (!secret || !isValidInternalToken(readToken(req), secret)) {
    sendJson(res, 401, { error: "Unauthorized." });
    return;
  }

  const publishMatch = path.match(
    /^\/internal\/publish\/([^/]+)\/([^/]+)$/,
  );
  const unpublishMatch = path.match(
    /^\/internal\/unpublish\/([^/]+)\/([^/]+)$/,
  );

  if (method !== "POST" || (!publishMatch && !unpublishMatch)) {
    sendJson(res, 404, { error: "Not found." });
    return;
  }

  const [, namespace, itemId] = publishMatch ?? unpublishMatch ?? [];
  if (!namespace || !itemId) {
    sendJson(res, 400, { error: "Invalid path." });
    return;
  }

  const handlers = getPublishHandlers(namespace);
  if (!handlers) {
    sendJson(res, 404, {
      error: `Module "${namespace}" does not support publishing.`,
    });
    return;
  }

  try {
    if (publishMatch) {
      await handlers.publish({ botToken: config.discordToken }, itemId);
      console.log(
        `[internal-api] published ${namespace} panel "${itemId}".`,
      );
    } else {
      await handlers.unpublish(itemId);
      console.log(
        `[internal-api] unpublished ${namespace} panel "${itemId}".`,
      );
    }
    sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error(
      `[internal-api] ${publishMatch ? "publish" : "unpublish"} ${namespace}/${itemId} failed:`,
      err,
    );
    sendJson(res, 400, {
      error: publishMatch ? "Publish failed." : "Unpublish failed.",
    });
  }
}

/** Client-safe message for publish/unpublish failures (no internal detail). */
export function publishClientError(isPublish: boolean): string {
  return isPublish ? "Publish failed." : "Unpublish failed.";
}

export function startInternalApi(): void {
  const port = config.internalApiPort;
  const bind = config.internalApiBind ?? "127.0.0.1";

  if (!config.internalApiSecret) {
    console.warn(
      "[internal-api] internalApiSecret is not set; internal API disabled.",
    );
    return;
  }

  const server = createServer((req, res) => {
    void handleRequest(req, res).catch((err) => {
      console.error("[internal-api] Unhandled request error:", err);
      if (!res.headersSent) {
        sendJson(res, 500, { error: "Internal server error." });
      }
    });
  });

  server.listen(port, bind, () => {
    console.log(`[internal-api] Listening on http://${bind}:${port}.`);
  });
}
