export const SLUG_ID = /^[a-z0-9-]{1,32}$/;
export const SNOWFLAKE = /^\d{17,20}$/;

export function assertSlugId(id: string, label: string): void {
  if (!SLUG_ID.test(id)) {
    throw new Error(
      `${label}: id must use lowercase letters, numbers, and hyphens only (no colons).`,
    );
  }
}

export function assertSnowflake(value: string, label: string): void {
  if (value && !SNOWFLAKE.test(value)) {
    throw new Error(`${label} must be a valid Discord ID.`);
  }
}

export function assertSnowflakesInArray(values: string[], label: string): void {
  for (let i = 0; i < values.length; i++) {
    assertSnowflake(values[i], `${label}[${i}]`);
  }
}
