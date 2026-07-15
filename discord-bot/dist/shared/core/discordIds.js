export const SLUG_ID = /^[a-z0-9-]{1,32}$/;
export const SNOWFLAKE = /^\d{17,20}$/;
export function assertSlugId(id, label) {
    if (!SLUG_ID.test(id)) {
        throw new Error(`${label}: id must use lowercase letters, numbers, and hyphens only (no colons).`);
    }
}
export function assertSnowflake(value, label) {
    if (value && !SNOWFLAKE.test(value)) {
        throw new Error(`${label} must be a valid Discord ID.`);
    }
}
export function assertSnowflakesInArray(values, label) {
    for (let i = 0; i < values.length; i++) {
        assertSnowflake(values[i], `${label}[${i}]`);
    }
}
//# sourceMappingURL=discordIds.js.map