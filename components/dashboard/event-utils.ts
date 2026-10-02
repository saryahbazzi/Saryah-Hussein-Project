import type { DemoEvent, DemoGuest, GuestStatus } from "@/lib/demo/types";

const DAY = 86_400_000;
const RIYADH_OFFSET = 3 * 3_600_000; // Asia/Riyadh is UTC+3 all year (no DST)

/** Whole calendar days from `now` to the event, counted in Riyadh time. Negative when the event is in the past. */
export function daysUntil(startsAtIso: string, now = Date.now()): number {
  return Math.floor((Date.parse(startsAtIso) + RIYADH_OFFSET) / DAY) - Math.floor((now + RIYADH_OFFSET) / DAY);
}

export type EventBucket = "upcoming" | "past" | "drafts";

export function bucketOf(ev: Pick<DemoEvent, "status" | "startsAt">, now = Date.now()): EventBucket {
  if (ev.status === "draft") return "drafts";
  if (ev.status === "done" || daysUntil(ev.startsAt, now) < 0) return "past";
  return "upcoming";
}

/** Most recent thing that happened to a guest (for the "last activity" column). */
export function lastActivity(g: DemoGuest): string | undefined {
  return [g.checkedInAt, g.respondedAt, g.deliveredAt, g.sentAt].filter(Boolean).sort().pop();
}

/** Display order when sorting guests by status: good news first. */
export const STATUS_ORDER: GuestStatus[] = ["confirmed", "delivered", "sent", "pending", "failed", "declined", "opted_out"];
export const GUEST_STATUSES = STATUS_ORDER;

/** Statuses for which a (re)send makes sense. */
export const RESENDABLE: GuestStatus[] = ["pending", "sent", "delivered", "failed"];

/** People expected = sum of party sizes of confirmed guests. */
export const expectedPeople = (guests: DemoGuest[]) =>
  guests.reduce((a, g) => a + (g.status === "confirmed" ? g.partySize : 0), 0);

/** Share of `part` in `total` as a whole percentage (0 when there is nothing to divide). */
export const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

/** Filename-safe slug for downloads. */
export const fileSlug = (s: string, fallback = "event") =>
  s.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 40) || fallback;

/** Events a user may see on the dashboard: admins see everything, everyone else only what they own. */
export function eventsFor<E extends Pick<DemoEvent, "ownerId">>(events: E[], user: { id: string; role: string }): E[] {
  return user.role === "admin" ? events : events.filter((e) => e.ownerId === user.id);
}

/** Upcoming: soonest first. Past: most recent first. Drafts: newest first. */
export function sortForBucket<E extends Pick<DemoEvent, "startsAt" | "createdAt">>(events: E[], bucket: EventBucket): E[] {
  const by = (k: "startsAt" | "createdAt", dir: 1 | -1) => (a: E, b: E) => dir * (Date.parse(a[k]) - Date.parse(b[k]));
  return [...events].sort(bucket === "upcoming" ? by("startsAt", 1) : bucket === "past" ? by("startsAt", -1) : by("createdAt", -1));
}
