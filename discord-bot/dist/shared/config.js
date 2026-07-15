import { initDb, loadDbBootstrapConfig } from "./core/db.js";
import { APP_CONFIG_TABLE } from "./core/moduleTable.js";
import { getDbDataAll } from "./core/dbData.js";
function trimmedOrUndefined(value) {
    return typeof value === "string" && value.trim() !== ""
        ? value.trim()
        : undefined;
}
function optionalPort(value, fallback) {
    const parsed = typeof value === "number"
        ? value
        : Number.parseInt(String(value ?? ""), 10);
    return Number.isInteger(parsed) && parsed > 0 && parsed < 65536
        ? parsed
        : fallback;
}
function requiredFromRows(rows, key) {
    const value = trimmedOrUndefined(rows[key]);
    if (!value) {
        throw new Error(`Missing required app config "${key}" in database table "${APP_CONFIG_TABLE}". ` +
            "Run ./scripts/db/db-init.sh to populate app_config.");
    }
    return value;
}
/** Keys in app_config that must not appear in default SQL dumps. */
export const APP_CONFIG_SECRET_KEYS = new Set([
    "discordToken",
    "clientSecret",
    "sessionSecret",
]);
export let config;
export async function initConfig(options) {
    await initDb(loadDbBootstrapConfig(), options?.readonly ? { readonly: true } : undefined);
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
//# sourceMappingURL=config.js.map