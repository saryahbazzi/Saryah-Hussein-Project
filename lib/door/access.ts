import type { DemoEvent, DemoState, DemoUser } from "@/lib/demo/types";

const DAY_FMT = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" });
export const riyadhDay = (d: Date | string | number) => DAY_FMT.format(new Date(d));

/** Events a user may scan for. Staff: live, or finished today. Hosts/planners: their own live/done events. Admin: all but drafts. */
export function scannableEvents(state: DemoState, user: Pick<DemoUser, "id" | "role">, now = Date.now()): DemoEvent[] {
  const today = riyadhDay(now);
  const list = state.events.filter((e) => {
    if (e.status === "draft") return false;
    switch (user.role) {
      case "admin": return true;
      case "staff": return e.status === "live" || riyadhDay(e.startsAt) === today;
      default: return e.ownerId === user.id;
    }
  });
  return list.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
