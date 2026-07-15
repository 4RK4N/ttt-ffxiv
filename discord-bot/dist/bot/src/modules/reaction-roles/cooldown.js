const COOLDOWN_MS = 2000;
const TTL_MS = COOLDOWN_MS * 2;
const lastActionAt = new Map();
function cooldownKey(userId, panelId) {
    return `${userId}:${panelId}`;
}
function pruneStale(now) {
    for (const [key, ts] of lastActionAt) {
        if (now - ts > TTL_MS)
            lastActionAt.delete(key);
    }
}
export function isOnCooldown(userId, panelId) {
    const now = Date.now();
    const ts = lastActionAt.get(cooldownKey(userId, panelId));
    if (ts === undefined)
        return false;
    if (now - ts >= COOLDOWN_MS) {
        lastActionAt.delete(cooldownKey(userId, panelId));
        return false;
    }
    if (lastActionAt.size > 500)
        pruneStale(now);
    return true;
}
export function touchCooldown(userId, panelId) {
    lastActionAt.set(cooldownKey(userId, panelId), Date.now());
}
//# sourceMappingURL=cooldown.js.map