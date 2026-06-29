// Pin the API version. Unversioned requests can return legacy response shapes
// (e.g. a guild's `permissions` as a number instead of a string). Pinning keeps
// the responses predictable across the web editor's Discord calls.
export const DISCORD_API = 'https://discord.com/api/v10';
