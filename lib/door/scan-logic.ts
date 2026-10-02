import { checkIn } from "@/lib/demo/actions";
import type { DemoGuest, DemoState, ScanLog } from "@/lib/demo/types";
import { verifyToken } from "@/lib/qr/token";

/** Why a scan was rejected. Drives the copy on the red banner. */
export type InvalidReason = "unknown_code" | "wrong_event" | "unknown_guest" | "not_confirmed";

export interface ScanView {
  result: ScanLog["result"];
  reason?: InvalidReason;
  guest?: DemoGuest;
  /** When already used: who scanned first (user id) and when. */
  usedAt?: string;
  usedBy?: string;
}

/** Tokens that fail signature checks, or belong to a different event or an unknown guest, never touch a guest record. */
export async function classifyCode(raw: string, eventId: string, guests: DemoGuest[]): Promise<{ guestId: string; reason?: InvalidReason }> {
  const parsed = await verifyToken(raw);
  if (!parsed) return { guestId: "", reason: "unknown_code" };
  if (parsed.eventId !== eventId) return { guestId: parsed.guestId, reason: "wrong_event" };
  if (!guests.some((g) => g.id === parsed.guestId && g.eventId === eventId)) return { guestId: parsed.guestId, reason: "unknown_guest" };
  return { guestId: parsed.guestId };
}

/**
 * Pure end-to-end scan: verifies the code, runs the check-in transition and maps the outcome to a view.
 * Every attempt (including rejects) is logged by `checkIn`, so "Recent scans" shows the whole picture.
 */
export async function processScan(
  state: DemoState, raw: string, eventId: string, userId: string, nowIso = new Date().toISOString(),
): Promise<{ state: DemoState; view: ScanView }> {
  return applyClassified(state, eventId, await classifyCode(raw, eventId, state.guests), userId, nowIso);
}

/** Synchronous half of a scan, safe to run inside the store's `dispatch` so the freshest state is used. */
export function applyClassified(
  state: DemoState, eventId: string, c: { guestId: string; reason?: InvalidReason }, userId: string, nowIso = new Date().toISOString(),
): { state: DemoState; view: ScanView } {
  if (c.reason) {
    // Log the reject without touching any guest (an empty id never matches).
    const r = checkIn(state, eventId, "", userId, nowIso);
    return { state: r.state, view: { result: "invalid", reason: c.reason } };
  }
  return applyCheckIn(state, eventId, c.guestId, userId, nowIso);
}

/** Check a known guest in (also the manual search path) and map the outcome to a view. */
export function applyCheckIn(
  state: DemoState, eventId: string, guestId: string, userId: string, nowIso = new Date().toISOString(),
): { state: DemoState; view: ScanView } {
  const r = checkIn(state, eventId, guestId, userId, nowIso);
  const { outcome } = r;
  if (outcome.result === "valid") return { state: r.state, view: { result: "valid", guest: outcome.guest } };
  if (outcome.result === "already_used") {
    return { state: r.state, view: { result: "already_used", guest: outcome.guest, usedAt: outcome.guest?.checkedInAt, usedBy: outcome.guest?.checkedInBy } };
  }
  const guest = state.guests.find((g) => g.id === guestId && g.eventId === eventId);
  return { state: r.state, view: { result: "invalid", reason: guest ? "not_confirmed" : "unknown_guest", guest } };
}

/** Ignore the same code for `windowMs` after it was last processed. */
export interface LastScan { code: string; at: number }
export function shouldProcess(last: LastScan | null, code: string, now: number, windowMs = 3000): boolean {
  return !(last && last.code === code && now - last.at < windowMs);
}

/** Confirmed guests matching a name or phone fragment. Digits-only queries match phone numbers. */
export function searchGuests(guests: DemoGuest[], query: string, limit = 8): DemoGuest[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  return guests
    .filter((g) => g.status === "confirmed")
    .filter((g) => g.name.toLowerCase().includes(q) || (digits.length >= 3 && g.phone.replace(/\D/g, "").includes(digits)))
    .slice(0, limit);
}

export interface DoorCounts { attended: number; confirmed: number; people: number; peopleConfirmed: number }
export function doorCounts(guests: DemoGuest[]): DoorCounts {
  const present = guests.filter((g) => g.checkedInAt);
  const confirmed = guests.filter((g) => g.status === "confirmed");
  const sum = (xs: DemoGuest[]) => xs.reduce((a, g) => a + g.partySize, 0);
  return { attended: present.length, confirmed: confirmed.length, people: sum(present), peopleConfirmed: sum(confirmed) };
}

/** Breaks a token's signature (for the demo "invalid code" tester). */
export function tamperToken(token: string): string {
  const last = token.slice(-1);
  return token.slice(0, -1) + (last === "A" ? "B" : "A");
}
