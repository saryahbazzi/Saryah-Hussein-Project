import { PRICING } from "@/lib/pricing/config";
import type { DemoEvent, DemoMessage, DemoState, DemoUser, EventStatus, MessageKindName } from "@/lib/demo/types";

/** Pure aggregation for the admin dashboard. "now" is always a parameter so results are reproducible. */

const DAY = 86_400_000;
const RIYADH_OFFSET = 3 * 3_600_000; // Saudi Arabia has no DST.

export interface MonthBucket { key: string; start: number; end: number }

/** The last `n` calendar months (Riyadh time), oldest first, ending with the month containing `now`. */
export function lastMonths(now: number, n = 6): MonthBucket[] {
  const d = new Date(now + RIYADH_OFFSET);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const out: MonthBucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const startUtc = Date.UTC(y, m - i, 1) - RIYADH_OFFSET;
    const endUtc = Date.UTC(y, m - i + 1, 1) - RIYADH_OFFSET;
    const s = new Date(startUtc + RIYADH_OFFSET);
    out.push({ key: `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, "0")}`, start: startUtc, end: endUtc });
  }
  return out;
}

const ts = (iso: string) => Date.parse(iso);
const inRange = (iso: string, from: number, to: number) => { const t = ts(iso); return t >= from && t < to; };
const round2 = (n: number) => Math.round(n * 100) / 100;

export const paidOrders = (s: DemoState) => s.orders.filter((o) => o.status === "paid");

export interface Delta { current: number; previous: number; pct: number | null }

/** Change vs. the previous window. `pct` is null when there is no baseline to compare with. */
export function delta(current: number, previous: number): Delta {
  return { current, previous, pct: previous > 0 ? (current - previous) / previous : null };
}

export function windowDelta(items: { at: string; value?: number }[], now: number, days = 30): Delta {
  const cur = items.filter((i) => inRange(i.at, now - days * DAY, now + 1)).reduce((a, i) => a + (i.value ?? 1), 0);
  const prev = items.filter((i) => inRange(i.at, now - 2 * days * DAY, now - days * DAY)).reduce((a, i) => a + (i.value ?? 1), 0);
  return delta(cur, prev);
}

export const isCustomer = (u: DemoUser) => u.role === "host" || u.role === "planner";

export interface Kpis {
  customers: { total: number; hosts: number; planners: number; delta: Delta };
  events: { total: number; live: number; done: number; draft: number; delta: Delta };
  guests: { total: number; delta: Delta };
  revenue: { incVat: number; exVat: number; delta: Delta };
  messages: { total: number; delta: Delta };
  aov: { value: number; delta: Delta };
}

export function computeKpis(s: DemoState, now: number): Kpis {
  const orders = paidOrders(s);
  const customers = s.users.filter(isCustomer);
  const incVat = round2(orders.reduce((a, o) => a + o.total, 0));
  const exVat = round2(orders.reduce((a, o) => a + (o.total - o.vat), 0));
  const outbound = s.messages.filter((m) => m.kind !== "reply");
  const evAt = (id: string) => s.events.find((e) => e.id === id)?.createdAt ?? new Date(0).toISOString();
  const cnt = (st: EventStatus) => s.events.filter((e) => e.status === st).length;

  const win = (from: number, to: number) => {
    const os = orders.filter((o) => inRange(o.createdAt, from, to));
    return { rev: os.reduce((a, o) => a + o.total, 0), n: os.length };
  };
  const cur = win(now - 30 * DAY, now + 1);
  const prev = win(now - 60 * DAY, now - 30 * DAY);

  return {
    customers: {
      total: customers.length,
      hosts: customers.filter((u) => u.role === "host").length,
      planners: customers.filter((u) => u.role === "planner").length,
      delta: windowDelta(customers.map((u) => ({ at: u.createdAt })), now),
    },
    events: { total: s.events.length, live: cnt("live"), done: cnt("done"), draft: cnt("draft"), delta: windowDelta(s.events.map((e) => ({ at: e.createdAt })), now) },
    guests: { total: s.guests.length, delta: windowDelta(s.guests.map((g) => ({ at: evAt(g.eventId) })), now) },
    revenue: { incVat, exVat, delta: windowDelta(orders.map((o) => ({ at: o.createdAt, value: o.total })), now) },
    messages: { total: outbound.length, delta: windowDelta(outbound.map((m) => ({ at: m.createdAt })), now) },
    aov: {
      value: orders.length ? round2(incVat / orders.length) : 0,
      delta: delta(cur.n ? cur.rev / cur.n : 0, prev.n ? prev.rev / prev.n : 0),
    },
  };
}

export interface MonthRevenue { key: string; incVat: number; exVat: number; orders: number }

export function revenueByMonth(s: DemoState, now: number, n = 6): MonthRevenue[] {
  return lastMonths(now, n).map((b) => {
    const os = paidOrders(s).filter((o) => inRange(o.createdAt, b.start, b.end));
    return { key: b.key, incVat: round2(os.reduce((a, o) => a + o.total, 0)), exVat: round2(os.reduce((a, o) => a + o.total - o.vat, 0)), orders: os.length };
  });
}

export type MessageGroup = "invite" | "reminders" | "tickets" | "replies";
export const MESSAGE_GROUPS: MessageGroup[] = ["invite", "reminders", "tickets", "replies"];

export function groupOfKind(k: MessageKindName): MessageGroup {
  switch (k) {
    case "invite": return "invite";
    case "reminder_7d":
    case "reminder_1d": return "reminders";
    case "ticket": return "tickets";
    default: return "replies";
  }
}

export interface MonthMessages { key: string; total: number; byGroup: Record<MessageGroup, number> }

export function messagesByMonth(messages: DemoMessage[], now: number, n = 6): MonthMessages[] {
  return lastMonths(now, n).map((b) => {
    const byGroup: Record<MessageGroup, number> = { invite: 0, reminders: 0, tickets: 0, replies: 0 };
    for (const m of messages) if (inRange(m.createdAt, b.start, b.end)) byGroup[groupOfKind(m.kind)]++;
    return { key: b.key, total: MESSAGE_GROUPS.reduce((a, g) => a + byGroup[g], 0), byGroup };
  });
}

export function countBy<T, K extends string>(items: T[], key: (t: T) => K): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const i of items) out[key(i)] = (out[key(i)] ?? 0) + 1;
  return out;
}

export const eventsByCity = (events: DemoEvent[]) => countBy(events, (e) => e.city);
export const eventsByOccasion = (events: DemoEvent[]) => countBy(events, (e) => e.occasion);

export interface CustomerRow {
  user: DemoUser;
  events: DemoEvent[];
  guests: number;
  spend: number;
  lastEventAt: string | null;
}

export function customerRows(s: DemoState): CustomerRow[] {
  return s.users.filter(isCustomer).map((user) => {
    const events = s.events.filter((e) => e.ownerId === user.id);
    const ids = new Set(events.map((e) => e.id));
    const spend = round2(paidOrders(s).filter((o) => o.ownerId === user.id).reduce((a, o) => a + o.total, 0));
    const last = events.map((e) => e.startsAt).sort().at(-1) ?? null;
    return { user, events, guests: s.guests.filter((g) => ids.has(g.eventId)).length, spend, lastEventAt: last };
  });
}

export const topCustomers = (s: DemoState, n = 5) =>
  customerRows(s).filter((r) => r.spend > 0).sort((a, b) => b.spend - a.spend).slice(0, n);

export interface EventRow {
  event: DemoEvent;
  owner?: DemoUser;
  clientName?: string;
  guests: number;
  confirmed: number;
  attended: number;
  orderTotal: number;
}

export function eventRows(s: DemoState): EventRow[] {
  return s.events.map((event) => {
    const gs = s.guests.filter((g) => g.eventId === event.id);
    return {
      event,
      owner: s.users.find((u) => u.id === event.ownerId),
      clientName: event.clientId ? s.clients.find((c) => c.id === event.clientId)?.name : undefined,
      guests: gs.length,
      confirmed: gs.filter((g) => g.status === "confirmed").length,
      attended: gs.filter((g) => g.checkedInAt).length,
      orderTotal: round2(paidOrders(s).filter((o) => o.eventId === event.id).reduce((a, o) => a + o.total, 0)),
    };
  });
}

export interface Funnel { outbound: number; sent: number; delivered: number; readOrReplied: number; failed: number; failureRate: number }

/** Delivery funnel over outbound messages (everything except inbound replies). Each stage is a subset of the previous one. */
export function deliveryFunnel(messages: DemoMessage[]): Funnel {
  const outbound = messages.filter((m) => m.kind !== "reply");
  const replied = new Set(messages.filter((m) => m.kind === "reply").map((m) => m.guestId));
  const failed = outbound.filter((m) => m.status === "failed").length;
  const delivered = outbound.filter((m) => m.status === "delivered" || m.status === "read");
  const readOrReplied = delivered.filter((m) => m.status === "read" || replied.has(m.guestId)).length;
  return {
    outbound: outbound.length,
    sent: outbound.length - failed,
    delivered: delivered.length,
    readOrReplied,
    failed,
    failureRate: outbound.length ? failed / outbound.length : 0,
  };
}

/** Failure reasons come from the guest record (`error`) of failed messages. */
export function failureReasons(s: DemoState): { reason: string; count: number }[] {
  const byGuest = new Map(s.guests.map((g) => [g.id, g]));
  const counts = new Map<string, number>();
  for (const m of s.messages) {
    if (m.status !== "failed") continue;
    const reason = byGuest.get(m.guestId)?.error ?? "unknown";
    counts.set(reason, (counts.get(reason) ?? 0) + 1);
  }
  return [...counts].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}

export const recentMessages = (messages: DemoMessage[], n = 25) =>
  [...messages].sort((a, b) => ts(b.createdAt) - ts(a.createdAt)).slice(0, n);

export function templateUsage(s: DemoState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of s.events) out[e.templateSlug] = (out[e.templateSlug] ?? 0) + 1;
  return out;
}

/** URL-safe slug from an English name. */
export function slugify(name: string): string {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

export const slugTaken = (existing: string[], slug: string) => existing.includes(slug);

export const VAT_PCT = Math.round(PRICING.vatRate * 100);
