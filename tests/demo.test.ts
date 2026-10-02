import { describe, expect, it } from "vitest";
import { createSeed } from "@/lib/demo/seed";
import { applyInboundEvent, checkIn, computeStats, eraseGuest, guestsOf, placeOrder, recordSend, reminderRecipients, reminderSchedule, setGuests, addEvent } from "@/lib/demo/actions";

const NOW = Date.parse("2026-05-01T10:00:00Z");

describe("demo seed", () => {
  const s = createSeed(NOW);
  it("is deterministic and has stats for the live event", () => {
    expect(createSeed(NOW).guests.map((g) => g.id)).toEqual(s.guests.map((g) => g.id));
    const st = computeStats(guestsOf(s, "e-1"));
    expect(st.total).toBe(60);
    expect(st.confirmed).toBeGreaterThan(20);
    expect(st.attended).toBe(0);
  });
  it("has every phone in valid Saudi format", () => {
    expect(s.guests.every((g) => /^\+9665\d{8}$/.test(g.phone))).toBe(true);
  });
});

describe("actions", () => {
  it("runs create → guests → order → send → reply → ticket check-in", () => {
    let s = createSeed(NOW);
    const { state, event } = addEvent(s, { ownerId: "u-host", title: "T", occasion: "dinner", startsAt: new Date(NOW + 9 * 86400000).toISOString(), venue: "V", city: "riyadh", templateSlug: "midnight-dinner", customization: { hosts: "H", headline: "", message: "", palette: { bg: "#000", ink: "#fff", accent: "#f00", frame: "#f00" }, language: "ar" } });
    s = setGuests(state, event.id, [{ name: "A", phone: "+966501111111" }, { name: "A dup", phone: "+966501111111" }, { name: "B", phone: "+966502222222", partySize: 2 }], new Date(NOW).toISOString());
    expect(guestsOf(s, event.id)).toHaveLength(2);
    const ordered = placeOrder(s, event.id, "standard", new Date(NOW).toISOString());
    s = ordered.state;
    expect(s.orders[0].total).toBe(195.5); // billed at the 10-guest minimum
    expect(s.events.find((e) => e.id === event.id)!.status).toBe("live");

    const [a] = guestsOf(s, event.id);
    s = recordSend(s, a.id, "invite", "hi", { ok: true, providerMessageId: "p1" }, new Date(NOW).toISOString());
    expect(guestsOf(s, event.id).find((g) => g.id === a.id)!.status).toBe("sent");
    s = applyInboundEvent(s, { type: "status", providerMessageId: "p1", status: "delivered", at: new Date(NOW).toISOString() }).state;
    expect(guestsOf(s, event.id).find((g) => g.id === a.id)!.status).toBe("delivered");
    // idempotent
    const again = applyInboundEvent(s, { type: "status", providerMessageId: "p1", status: "delivered", at: new Date(NOW).toISOString() }).state;
    expect(again.messages.length).toBe(s.messages.length);
    const r = applyInboundEvent(s, { type: "reply", from: a.phone, intent: "confirm", text: "rsvp_yes", at: new Date(NOW).toISOString() });
    s = r.state;
    expect(r.confirmedGuestId).toBe(a.id);

    const c1 = checkIn(s, event.id, a.id, "u-staff");
    expect(c1.outcome.result).toBe("valid");
    const c2 = checkIn(c1.state, event.id, a.id, "u-staff");
    expect(c2.outcome.result).toBe("already_used");
    expect(checkIn(c2.state, event.id, "nope", "u-staff").outcome.result).toBe("invalid");
    expect(computeStats(guestsOf(c2.state, event.id)).attended).toBe(1);
  });

  it("opt-out stops a guest and erase removes them", () => {
    let s = createSeed(NOW);
    const g = guestsOf(s, "e-1")[0];
    s = applyInboundEvent(s, { type: "reply", from: g.phone, intent: "stop", text: "STOP", at: new Date(NOW).toISOString() }).state;
    expect(s.guests.find((x) => x.id === g.id)!.status).toBe("opted_out");
    s = eraseGuest(s, g.id);
    expect(s.guests.find((x) => x.id === g.id)).toBeUndefined();
    expect(s.messages.some((m) => m.guestId === g.id)).toBe(false);
  });

  it("builds a reminder schedule", () => {
    const s = createSeed(NOW);
    const ev = s.events.find((e) => e.id === "e-1")!;
    const sched = reminderSchedule(s, ev, NOW);
    expect(sched.map((x) => x.kind)).toEqual(["reminder_7d", "reminder_1d"]);
    expect(sched[1].state).toBe("scheduled");
    expect(reminderRecipients(s, "e-1", "reminder_7d").length).toBeGreaterThan(0);
  });
});
