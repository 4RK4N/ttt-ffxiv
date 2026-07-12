import {
  PermissionFlagsBits,
  Routes,
  type APIGuildMember,
  type Guild,
  type ThreadChannel,
} from "discord.js";
import { sleep } from "../../lib/core/sleep.js";
import { getMembersForGuild, upsertApiMember } from "./member-cache.js";

/** Discord max per GET /guilds/{id}/members page. */
const MEMBER_LIST_PAGE_SIZE = 1000;
/** Pause between member-list pages (discord.js REST also rate-limits; this stays conservative). */
const MEMBER_LIST_PAGE_DELAY_MS = 1000;
/** Pause between private-thread member adds on ticket open. */
const THREAD_MEMBER_ADD_DELAY_MS = 250;

/** Guilds whose full member list has been fetched this session. */
const memberCacheWarmed = new Set<string>();

/** In-flight warm requests — concurrent ticket opens await the same fetch. */
const warmPromises = new Map<string, Promise<void>>();

async function fetchAllGuildMembers(guild: Guild): Promise<number> {
  let after: string | undefined;
  let total = 0;

  for (; ;) {
    const query = new URLSearchParams({ limit: String(MEMBER_LIST_PAGE_SIZE) });
    if (after) query.set("after", after);

    const page = (await guild.client.rest.get(Routes.guildMembers(guild.id), {
      query,
    })) as APIGuildMember[];

    for (const data of page) {
      upsertApiMember(guild.id, data);
      total++;
    }

    if (page.length < MEMBER_LIST_PAGE_SIZE) break;
    after = page[page.length - 1]!.user.id;
    await sleep(MEMBER_LIST_PAGE_DELAY_MS);
  }

  return total;
}

/**
 * Fetches all guild members once per session into the tickets member map.
 * Gateway listeners in member-cache.ts keep it updated afterward.
 */
export async function warmGuildMemberCache(guild: Guild): Promise<void> {
  if (memberCacheWarmed.has(guild.id)) return;

  const inFlight = warmPromises.get(guild.id);
  if (inFlight) return inFlight;

  const promise = (async () => {
    try {
      await fetchAllGuildMembers(guild);
      memberCacheWarmed.add(guild.id);
    } catch (err) {
      console.error(
        `[tickets] Failed to warm member cache for guild ${guild.id}:`,
        err,
      );
      throw err;
    } finally {
      warmPromises.delete(guild.id);
    }
  })();

  warmPromises.set(guild.id, promise);
  return promise;
}

/** Non-bot guild admins plus all members of the configured staff role (deduped). */
export async function collectStaffUserIds(
  guild: Guild,
  staffRoleId: string,
): Promise<string[]> {
  try {
    await warmGuildMemberCache(guild);
  } catch {
    // Ticket open proceeds; staff auto-add may be partial until warm succeeds.
  }

  const adminRoleIds = new Set<string>();
  for (const role of guild.roles.cache.values()) {
    if (role.permissions.has(PermissionFlagsBits.Administrator)) {
      adminRoleIds.add(role.id);
    }
  }

  const ids = new Set<string>();

  for (const [userId, member] of getMembersForGuild(guild.id)) {
    if (member.isBot) continue;
    if (
      member.roleIds.includes(staffRoleId) ||
      member.roleIds.some((rid) => adminRoleIds.has(rid))
    ) {
      ids.add(userId);
    }
  }

  return [...ids];
}

export async function addMembersToThread(
  thread: ThreadChannel,
  userIds: string[],
): Promise<void> {
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i]!;
    try {
      await thread.members.add(userId);
    } catch (err) {
      console.warn(
        `[tickets] Failed to add user ${userId} to thread ${thread.id}:`,
        err,
      );
    }
    if (i < userIds.length - 1) {
      await sleep(THREAD_MEMBER_ADD_DELAY_MS);
    }
  }
}
