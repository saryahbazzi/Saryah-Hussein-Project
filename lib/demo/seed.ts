import { TEMPLATES } from "@/lib/templates/catalog";
import { calculatePrice } from "@/lib/pricing/calculate";
import type { DemoEvent, DemoGuest, DemoMessage, DemoOrder, DemoState, DemoUser, GuestStatus } from "./types";

export const DEMO_USERS = {
  admin: "u-admin",
  host: "u-host",
  planner: "u-planner",
  staff: "u-staff",
} as const;

const DAY = 86_400_000;
const HOUR = 3_600_000;

const MALE = ["عبدالله", "فهد", "سعود", "خالد", "تركي", "ماجد", "ناصر", "سلطان", "راكان", "بندر", "يوسف", "أحمد", "عمر", "علي", "هاني"];
const FEMALE = ["ريم", "حصة", "مها", "دانة", "لمى", "جود", "شهد", "عبير", "سارة", "غادة", "ريماس", "نوف", "لجين", "هيفاء", "منى"];
const FAMILY = ["العتيبي", "القحطاني", "الغامدي", "الشهري", "الدوسري", "الحربي", "المطيري", "الزهراني", "العنزي", "السبيعي"];
const MALE_EN = ["Abdullah", "Fahad", "Saud", "Khalid", "Turki", "Majed", "Nasser", "Sultan", "Rakan", "Bandar", "Yousef", "Ahmed", "Omar", "Ali", "Hani"];
const FEMALE_EN = ["Reem", "Hessa", "Maha", "Dana", "Lama", "Joud", "Shahad", "Abeer", "Sarah", "Ghada", "Rimas", "Nouf", "Lujain", "Haifa", "Mona"];
const FAMILY_EN = ["Al-Otaibi", "Al-Qahtani", "Al-Ghamdi", "Al-Shehri", "Al-Dosari", "Al-Harbi", "Al-Mutairi", "Al-Zahrani", "Al-Anazi", "Al-Subaie"];

const iso = (ms: number) => new Date(ms).toISOString();

/** Deterministic status mix so the demo looks the same on every device (QR codes stay scannable across devices). */
function statusFor(i: number, sent: boolean): GuestStatus {
  if (!sent) return "pending";
  const r = i % 20;
  if (r < 9) return "confirmed";
  if (r < 11) return "declined";
  if (r < 15) return "delivered";
  if (r < 18) return "sent";
  if (r === 18) return "failed";
  return "delivered";
}

function makeGuests(eventId: string, prefix: string, count: number, now: number, opts: { sent: boolean; arabicNames: boolean; phoneBase: number; checkedIn?: boolean; sentAgo?: number }): DemoGuest[] {
  const out: DemoGuest[] = [];
  for (let i = 0; i < count; i++) {
    const female = i % 2 === 1;
    const first = opts.arabicNames ? (female ? FEMALE : MALE)[i % 15] : (female ? FEMALE_EN : MALE_EN)[i % 15];
    const family = opts.arabicNames ? FAMILY[i % 10] : FAMILY_EN[i % 10];
    const status = statusFor(i, opts.sent);
    const sentAt = opts.sent ? now - (opts.sentAgo ?? 2 * DAY) : undefined;
    const delivered = ["delivered", "confirmed", "declined"].includes(status);
    const responded = ["confirmed", "declined"].includes(status);
    out.push({
      id: `${prefix}-${String(i + 1).padStart(3, "0")}`,
      eventId,
      name: `${first} ${family}`,
      phone: `+9665${String(opts.phoneBase + i).padStart(8, "0")}`,
      partySize: 1 + (i % 4 === 0 ? 1 : 0) + (i % 9 === 0 ? 1 : 0),
      status,
      sentAt: sentAt ? iso(sentAt) : undefined,
      deliveredAt: delivered && sentAt ? iso(sentAt + 60_000) : undefined,
      respondedAt: responded && sentAt ? iso(sentAt + 3 * HOUR) : undefined,
      checkedInAt: opts.checkedIn && status === "confirmed" && i % 3 === 0 ? iso(now - HOUR) : undefined,
      checkedInBy: opts.checkedIn && status === "confirmed" && i % 3 === 0 ? DEMO_USERS.staff : undefined,
      consentAt: iso(now - 5 * DAY),
      consentSource: "host_attested",
      error: status === "failed" ? "not_on_whatsapp" : undefined,
    });
  }
  return out;
}

export function createSeed(nowMs = Date.now()): DemoState {
  const users: DemoUser[] = [
    { id: DEMO_USERS.admin, name: "Layla Al-Admin", role: "admin", email: "admin@dawati.test", phone: "+966500000001", createdAt: iso(nowMs - 200 * DAY) },
    { id: DEMO_USERS.host, name: "Mohammed Al-Qahtani", role: "host", email: "host@dawati.test", phone: "+966500000002", createdAt: iso(nowMs - 20 * DAY) },
    { id: DEMO_USERS.planner, name: "Noura Al-Saud", role: "planner", email: "planner@dawati.test", phone: "+966500000003", org: "Noura Events", createdAt: iso(nowMs - 90 * DAY) },
    { id: DEMO_USERS.staff, name: "Faisal (Door staff)", role: "staff", email: "staff@dawati.test", phone: "+966500000004", createdAt: iso(nowMs - 30 * DAY) },
  ];
  // Extra customers so the admin dashboard has a believable book of business.
  const extra: [string, string, "host" | "planner", string?][] = [
    ["Sara Al-Otaibi", "sara@example.test", "host"],
    ["Turki Al-Dosari", "turki@example.test", "host"],
    ["Maha Al-Ghamdi", "maha@example.test", "host"],
    ["Elegance Events", "hello@elegance.test", "planner", "Elegance Events"],
    ["Jeddah Weddings Co.", "team@jwc.test", "planner", "Jeddah Weddings Co."],
    ["Bandar Al-Harbi", "bandar@example.test", "host"],
  ];
  extra.forEach(([name, email, role, org], i) =>
    users.push({ id: `u-x${i + 1}`, name, role, email, phone: `+96655100000${i}`, org, createdAt: iso(nowMs - (150 - i * 22) * DAY) }),
  );

  const clients = [
    { id: "c-1", plannerId: DEMO_USERS.planner, name: "Al-Harbi Family", contact: "+966500000100" },
    { id: "c-2", plannerId: DEMO_USERS.planner, name: "Bakr & Partners", contact: "+966500000101" },
    { id: "c-3", plannerId: "u-x4", name: "Al-Rashid Family", contact: "+966500000102" },
  ];

  const cust = (hosts: string, headline: string, message: string, t: number, language: "ar" | "en" | "both" = "ar") => ({
    hosts, headline, message, palette: { ...TEMPLATES[t].palette }, language,
  });

  const events: DemoEvent[] = [
    { id: "e-1", ownerId: DEMO_USERS.host, title: "حفل زفاف محمد ونورة", occasion: "wedding", startsAt: iso(nowMs + 10 * DAY), venue: "قاعة النخيل، الرياض", city: "riyadh", templateSlug: "royal-navy-gold", customization: cust("محمد ونورة", "يتشرفان بدعوتكم", "بحضوركم تكتمل فرحتنا", 0), status: "live", createdAt: iso(nowMs - 6 * DAY), consentAttestedAt: iso(nowMs - 6 * DAY) },
    { id: "e-2", ownerId: DEMO_USERS.planner, clientId: "c-1", title: "Al-Harbi Engagement", occasion: "engagement", startsAt: iso(nowMs + 2 * DAY), venue: "Corniche Pavilion, Jeddah", city: "jeddah", templateSlug: "blush-engagement", customization: cust("Al-Harbi Family", "Invite you to celebrate the engagement of", "", 3, "en"), status: "live", createdAt: iso(nowMs - 9 * DAY), consentAttestedAt: iso(nowMs - 9 * DAY) },
    { id: "e-3", ownerId: DEMO_USERS.host, title: "Sara's Birthday Dinner", occasion: "birthday", startsAt: iso(nowMs + 30 * DAY), venue: "Diriyah Terrace, Riyadh", city: "riyadh", templateSlug: "garden-sage", customization: cust("Sara", "Join us for dinner", "", 5, "en"), status: "draft", createdAt: iso(nowMs - DAY) },
    { id: "e-4", ownerId: DEMO_USERS.planner, clientId: "c-2", title: "Bakr & Partners Launch Party", occasion: "party", startsAt: iso(nowMs + 20 * DAY), venue: "Waterfront Hall, Jeddah", city: "jeddah", templateSlug: "rose-celebration", customization: cust("Bakr & Partners", "You're invited to our launch", "", 9, "both"), status: "live", createdAt: iso(nowMs - 3 * DAY), consentAttestedAt: iso(nowMs - 3 * DAY) },
    { id: "e-5", ownerId: DEMO_USERS.host, title: "حفل خطوبة ريم", occasion: "engagement", startsAt: iso(nowMs - 25 * DAY), venue: "فندق الريتز كارلتون، الرياض", city: "riyadh", templateSlug: "golden-ring", customization: cust("ريم وعبدالعزيز", "تتشرف بدعوتكم", "", 4), status: "done", createdAt: iso(nowMs - 50 * DAY), consentAttestedAt: iso(nowMs - 50 * DAY) },
  ];
  // Historical events from other customers (drive admin revenue / message volume).
  const history: [string, string, number, number, number, number, boolean][] = [
    ["u-x1", "wedding", 40, 1, 150, 60, false], ["u-x2", "dinner", 70, 7, 100, 40, true], ["u-x3", "birthday", 110, 15, 80, 30, false],
    ["u-x4", "wedding", 15, 4, 300, 120, true], ["u-x5", "engagement", 55, 9, 200, 80, true], ["u-x6", "party", 95, 3, 60, 25, false],
    ["u-x4", "party", 130, 5, 220, 90, false], ["u-x5", "wedding", 80, 12, 350, 140, true],
  ];
  const orders: DemoOrder[] = [];
  const guests: DemoGuest[] = [];
  const messages: DemoMessage[] = [];
  history.forEach(([owner, occasion, daysAgo, , guestCount, , premium], i) => {
    const id = `e-h${i + 1}`;
    events.push({
      id, ownerId: owner, title: `${occasion === "wedding" ? "Wedding" : occasion === "party" ? "Party" : "Celebration"} #${i + 1}`,
      occasion: occasion as DemoEvent["occasion"], startsAt: iso(nowMs - (daysAgo - 10) * DAY), venue: i % 2 ? "Jeddah" : "Riyadh", city: i % 2 ? "jeddah" : "riyadh",
      templateSlug: TEMPLATES[i % TEMPLATES.length].slug, customization: cust("—", "", "", i % TEMPLATES.length), status: "done",
      createdAt: iso(nowMs - daysAgo * DAY),
    });
    const p = calculatePrice(premium ? "premium" : "standard", guestCount);
    orders.push({ id: `o-h${i + 1}`, eventId: id, ownerId: owner, tier: p.tier, guests: p.guests, base: p.base, guestsTotal: p.guestsTotal, vat: p.vat, total: p.total, status: "paid", createdAt: iso(nowMs - daysAgo * DAY) });
  });

  // Guests for the live demo events (deterministic ids: g-1-001 etc.).
  guests.push(...makeGuests("e-1", "g1", 60, nowMs, { sent: true, arabicNames: true, phoneBase: 10000000 }));
  guests.push(...makeGuests("e-2", "g2", 25, nowMs, { sent: true, arabicNames: false, phoneBase: 20000000, checkedIn: true, sentAgo: 4 * DAY }));
  guests.push(...makeGuests("e-4", "g4", 40, nowMs, { sent: true, arabicNames: false, phoneBase: 40000000, sentAgo: DAY }));
  guests.push(...makeGuests("e-5", "g5", 80, nowMs, { sent: true, arabicNames: true, phoneBase: 50000000, sentAgo: 40 * DAY }).map((g) => ({ ...g, checkedInAt: g.status === "confirmed" ? iso(nowMs - 25 * DAY) : undefined })));

  for (const [eid, owner, tier] of [["e-1", DEMO_USERS.host, "premium"], ["e-2", DEMO_USERS.planner, "standard"], ["e-4", DEMO_USERS.planner, "premium"], ["e-5", DEMO_USERS.host, "premium"]] as const) {
    const count = guests.filter((g) => g.eventId === eid).length;
    const p = calculatePrice(tier, count);
    orders.push({ id: `o-${eid}`, eventId: eid, ownerId: owner, tier, guests: p.guests, base: p.base, guestsTotal: p.guestsTotal, vat: p.vat, total: p.total, status: "paid", createdAt: events.find((e) => e.id === eid)!.createdAt });
  }

  for (const g of guests) {
    if (!g.sentAt) continue;
    messages.push({ id: `m-${g.id}`, eventId: g.eventId, guestId: g.id, kind: "invite", status: g.status === "failed" ? "failed" : g.deliveredAt ? "delivered" : "sent", providerMessageId: `seed.${g.id}`, text: "", createdAt: g.sentAt });
    if (g.respondedAt) messages.push({ id: `r-${g.id}`, eventId: g.eventId, guestId: g.id, kind: "reply", status: "received", text: g.status === "confirmed" ? "rsvp_yes" : "rsvp_no", createdAt: g.respondedAt });
  }
  // Extra volume for the admin message-volume chart.
  events.filter((e) => e.id.startsWith("e-h")).forEach((e, i) => {
    const o = orders.find((x) => x.eventId === e.id)!;
    for (let k = 0; k < Math.min(o.guests, 12); k++) {
      messages.push({ id: `m-${e.id}-${k}`, eventId: e.id, guestId: `${e.id}-g${k}`, kind: k % 3 === 0 ? "reminder_1d" : "invite", status: "delivered", text: "", createdAt: iso(Date.parse(e.createdAt) + i * HOUR) });
    }
  });

  return {
    version: 1, users, clients, events, guests, messages, orders, scans: [],
    templates: TEMPLATES.map((t) => ({ slug: t.slug, occasion: t.occasion, style: t.style, kind: t.kind, motif: t.motif, palette: t.palette, name: t.name, published: true })),
  };
}
