import { fetchGuildRolesRaw } from "./discordCache.js";
export async function listGuildRoles(cfg) {
    const raw = await fetchGuildRolesRaw(cfg);
    return raw
        .filter((r) => typeof r.id === "string" &&
        typeof r.name === "string" &&
        r.name !== "@everyone" &&
        r.managed !== true)
        .sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
        .map((r) => ({ id: r.id, name: r.name, color: r.color ?? 0 }));
}
//# sourceMappingURL=roles.js.map