import { calculatePrice } from "@/lib/pricing/calculate";
import type { PricingTier } from "@/lib/pricing/config";
import { tierOf } from "@/lib/templates/catalog";
import type { InboundEvent } from "@/lib/messaging/types";
import type {
  Customization, DemoClient, DemoEvent, DemoGuest, DemoInvite, InviteRole, DemoMessage, DemoState, DemoTemplate, GuestStats, GuestStatus, MessageKindName,
} from "./types";

/** Pure state transitions. The browser store (store.ts) wraps these; tests call them directly. */

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export function computeStats(guests: DemoGuest[]): GuestStats {
  return {
    total: guests.length,
    sent: guests.filter((g) => g.sentAt).length,
    delivered: guests.filter((g) => g.deliveredAt).length,
    confirmed: guests.filter((g) => g.status === "confirmed").length,
    declined: guests.filter((g) => g.status === "declined").length,
    pending: guests.filter((g) => ["pending", "sent", "delivered"].includes(g.status)).length,
    attended: guests.filter((g) => g.checkedInAt).length,
  };
}

export const guestsOf = (s: DemoState, eventId: string) => s.guests.filter((g) => g.eventId === eventId);

export function addEvent(s: DemoState, e: Omit<DemoEvent, "id" | "createdAt" | "status"> & { id?: string }): { state: DemoState; event: DemoEvent } {
  const event: DemoEvent = { ...e, id: e.id ?? uid("e"), status: "draft", createdAt: new Date().toISOString() };
  return { state: { ...s, events: [event, ...s.events] }, event };
}

export function updateEvent(s: DemoState, id: string, patch: Partial<DemoEvent>): DemoState {
  return { ...s, events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
}

export interface GuestInput { name: string; phone: string; partySize?: number }

/** Replaces the event's pending guest list. Guests that were already contacted are kept. */
export function setGuests(s: DemoState, eventId: string, rows: GuestInput[], consentAtIso: string): DemoState {
  const kept = s.guests.filter((g) => g.eventId !== eventId || g.sentAt);
  const seen = new Set(kept.filter((g) => g.eventId === eventId).map((g) => g.phone));
  const added: DemoGuest[] = [];
  for (const r of rows) {
    if (seen.has(r.phone)) continue;
    seen.add(r.phone);
    added.push({
      id: uid("g"), eventId, name: r.name, phone: r.phone, partySize: r.partySize ?? 1, status: "pending",
      consentAt: consentAtIso, consentSource: "host_attested",
    });
  }
  return { ...s, guests: [...kept, ...added] };
}

export function placeOrder(s: DemoState, eventId: string, tier: PricingTier, nowIso = new Date().toISOString()): { state: DemoState; orderId: string } {
  const ev = s.events.find((e) => e.id === eventId)!;
  const count = guestsOf(s, eventId).length;
  const p = calculatePrice(tier, count);
  const order = { id: uid("o"), eventId, ownerId: ev.ownerId, tier: p.tier, guests: p.guests, base: p.base, guestsTotal: p.guestsTotal, vat: p.vat, total: p.total, status: "paid" as const, createdAt: nowIso };
  return { state: { ...s, orders: [order, ...s.orders], events: s.events.map((e) => (e.id === eventId ? { ...e, status: "live", consentAttestedAt: e.consentAttestedAt ?? nowIso } : e)) }, orderId: order.id };
}

export function recordSend(s: DemoState, guestId: string, kind: MessageKindName, text: string, result: { ok: boolean; providerMessageId?: string; error?: string }, nowIso = new Date().toISOString()): DemoState {
  const g = s.guests.find((x) => x.id === guestId);
  if (!g) return s;
  const msg: DemoMessage = {
    id: uid("m"), eventId: g.eventId, guestId, kind, text, providerMessageId: result.providerMessageId,
    status: result.ok ? "sent" : "failed", createdAt: nowIso,
  };
  const guests = s.guests.map((x) => {
    if (x.id !== guestId) return x;
    if (!result.ok) return { ...x, status: "failed" as GuestStatus, error: result.error };
    // Only the first contact moves the guest out of "pending"; reminders keep their RSVP state.
    return { ...x, sentAt: x.sentAt ?? nowIso, error: undefined, status: x.status === "pending" || x.status === "failed" ? ("sent" as GuestStatus) : x.status };
  });
  return { ...s, guests, messages: [...s.messages, msg] };
}

/** Reference behaviour for provider webhooks (see lib/messaging/README.md). Safe to apply twice. */
export function applyInboundEvent(s: DemoState, ev: InboundEvent): { state: DemoState; confirmedGuestId?: string } {
  if (ev.type === "status") {
    const msg = s.messages.find((m) => m.providerMessageId === ev.providerMessageId);
    if (!msg) return { state: s };
    const rank = { queued: 0, sent: 1, delivered: 2, read: 3, failed: 9, received: 0 } as const;
    if (rank[ev.status] <= rank[msg.status] && ev.status !== "failed") return { state: s };
    const messages = s.messages.map((m) => (m.id === msg.id ? { ...m, status: ev.status } : m));
    const guests = s.guests.map((g) => {
      if (g.id !== msg.guestId) return g;
      if (ev.status === "failed") return { ...g, status: "failed" as GuestStatus, error: ev.error };
      if (ev.status === "delivered" || ev.status === "read") {
        return { ...g, deliveredAt: g.deliveredAt ?? ev.at, status: g.status === "sent" ? ("delivered" as GuestStatus) : g.status };
      }
      return g;
    });
    return { state: { ...s, messages, guests } };
  }
  const guest = s.guests.find((g) => g.phone === ev.from && (!ev.inReplyToProviderMessageId || s.messages.some((m) => m.providerMessageId === ev.inReplyToProviderMessageId && m.guestId === g.id)));
  if (!guest || guest.status === "opted_out") return { state: s };
  const reply: DemoMessage = { id: uid("m"), eventId: guest.eventId, guestId: guest.id, kind: "reply", status: "received", text: ev.text, createdAt: ev.at };
  let status: GuestStatus = guest.status;
  if (ev.intent === "confirm") status = "confirmed";
  else if (ev.intent === "decline") status = "declined";
  else if (ev.intent === "stop") status = "opted_out";
  else return { state: { ...s, messages: [...s.messages, reply] } };
  const guests = s.guests.map((g) => (g.id === guest.id ? { ...g, status, respondedAt: ev.at, deliveredAt: g.deliveredAt ?? ev.at } : g));
  return { state: { ...s, guests, messages: [...s.messages, reply] }, confirmedGuestId: status === "confirmed" && guest.status !== "confirmed" ? guest.id : undefined };
}

export type CheckInResult =
  | { result: "valid"; guest: DemoGuest }
  | { result: "already_used"; guest: DemoGuest }
  | { result: "invalid" };

/** Mirrors the SQL function check_in_guest(event, guest). */
export function checkIn(s: DemoState, eventId: string, guestId: string, byUserId: string, nowIso = new Date().toISOString()): { state: DemoState; outcome: CheckInResult } {
  const g = s.guests.find((x) => x.id === guestId && x.eventId === eventId);
  let outcome: CheckInResult;
  let state = s;
  if (g && g.status === "confirmed" && !g.checkedInAt) {
    const updated = { ...g, checkedInAt: nowIso, checkedInBy: byUserId };
    state = { ...s, guests: s.guests.map((x) => (x.id === g.id ? updated : x)) };
    outcome = { result: "valid", guest: updated };
  } else if (g && g.checkedInAt) outcome = { result: "already_used", guest: g };
  else outcome = { result: "invalid" };
  const scan = { id: uid("s"), eventId, guestId: g?.id, name: g?.name, result: outcome.result, by: byUserId, at: nowIso };
  return { state: { ...state, scans: [scan, ...state.scans].slice(0, 200) }, outcome };
}

/** PDPL: erase one guest and their messages. */
export function eraseGuest(s: DemoState, guestId: string): DemoState {
  return { ...s, guests: s.guests.filter((g) => g.id !== guestId), messages: s.messages.filter((m) => m.guestId !== guestId), scans: s.scans.filter((x) => x.guestId !== guestId) };
}

/** PDPL: erase every guest record for an event (keeps the event and its order). */
export function eraseEventGuests(s: DemoState, eventId: string): DemoState {
  return { ...s, guests: s.guests.filter((g) => g.eventId !== eventId), messages: s.messages.filter((m) => m.eventId !== eventId), scans: s.scans.filter((x) => x.eventId !== eventId) };
}

export function deleteEvent(s: DemoState, eventId: string): DemoState {
  const t = eraseEventGuests(s, eventId);
  return { ...t, events: t.events.filter((e) => e.id !== eventId), orders: t.orders.filter((o) => o.eventId !== eventId) };
}

export function upsertTemplate(s: DemoState, t: DemoTemplate): DemoState {
  const exists = s.templates.some((x) => x.slug === t.slug);
  return { ...s, templates: exists ? s.templates.map((x) => (x.slug === t.slug ? t : x)) : [...s.templates, t] };
}

export function setCustomization(s: DemoState, eventId: string, patch: Partial<Customization>): DemoState {
  return { ...s, events: s.events.map((e) => (e.id === eventId ? { ...e, customization: { ...e.customization, ...patch } } : e)) };
}

export const tierForTemplate = (s: DemoState, slug: string): PricingTier => {
  const t = s.templates.find((x) => x.slug === slug);
  return t ? tierOf(t.kind) : "standard";
};

/** Reminder offsets in ms before the event. */
export const REMINDERS = [
  { kind: "reminder_7d" as const, leadMs: 7 * 86_400_000 },
  { kind: "reminder_1d" as const, leadMs: 86_400_000 },
];

export type ReminderKind = (typeof REMINDERS)[number]["kind"];

export function reminderSchedule(s: DemoState, ev: DemoEvent, now = Date.now()) {
  return REMINDERS.map((r) => {
    const at = Date.parse(ev.startsAt) - r.leadMs;
    const sentCount = s.messages.filter((m) => m.eventId === ev.id && m.kind === r.kind).length;
    const state: "sent" | "due" | "scheduled" | "skipped" = sentCount > 0 ? "sent" : ev.status !== "live" ? "skipped" : at <= now ? (Date.parse(ev.startsAt) < now ? "skipped" : "due") : "scheduled";
    return { kind: r.kind, at: new Date(at).toISOString(), state, sentCount };
  });
}

/** Guests who should receive a reminder of this kind: not declined/opted-out/failed, not yet reminded. */
export function reminderRecipients(s: DemoState, eventId: string, kind: ReminderKind): DemoGuest[] {
  const already = new Set(s.messages.filter((m) => m.eventId === eventId && m.kind === kind).map((m) => m.guestId));
  return guestsOf(s, eventId).filter((g) => !already.has(g.id) && ["sent", "delivered", "confirmed", "pending"].includes(g.status) && g.sentAt);
}

/** Planner sub-accounts and team access. */
export function addClient(s: DemoState, plannerId: string, name: string, contact: string): { state: DemoState; client: DemoClient } {
  const client: DemoClient = { id: uid("c"), plannerId, name: name.trim(), contact };
  return { state: { ...s, clients: [...s.clients, client] }, client };
}

export function addInvite(s: DemoState, plannerId: string, email: string, role: InviteRole, nowIso = new Date().toISOString()): DemoState {
  const invite: DemoInvite = { id: uid("i"), plannerId, email: email.trim().toLowerCase(), role, status: "pending", createdAt: nowIso };
  return { ...s, invites: [...(s.invites ?? []), invite] };
}

export function revokeInvite(s: DemoState, inviteId: string): DemoState {
  return { ...s, invites: (s.invites ?? []).filter((i) => i.id !== inviteId) };
}

/** Appends one guest to an event (ignored if the phone is already on the list). Used by the dashboard's add-guest form. */
export function addGuest(s: DemoState, eventId: string, input: GuestInput, consentAtIso = new Date().toISOString()): DemoState {
  if (s.guests.some((g) => g.eventId === eventId && g.phone === input.phone)) return s;
  const guest: DemoGuest = {
    id: uid("g"), eventId, name: input.name, phone: input.phone, partySize: input.partySize ?? 1, status: "pending",
    consentAt: consentAtIso, consentSource: "host_attested",
  };
  return { ...s, guests: [...s.guests, guest] };
}

/** Removes a template. Callers must not delete templates that events still use (unpublish them instead). */
export function deleteTemplate(s: DemoState, slug: string): DemoState {
  if (s.events.some((e) => e.templateSlug === slug)) return s;
  return { ...s, templates: s.templates.filter((t) => t.slug !== slug) };
}
