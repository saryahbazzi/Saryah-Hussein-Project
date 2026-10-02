import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { createSeed } from "@/lib/demo/seed";
import { createToken } from "@/lib/qr/token";
import { applyCheckIn, classifyCode, doorCounts, processScan, searchGuests, shouldProcess, tamperToken } from "@/lib/door/scan-logic";
import { buildIcs, mapsLinkFor } from "@/lib/door/ics";
import { riyadhDay, scannableEvents } from "@/lib/door/access";
import { decodeQrFromImageData } from "@/lib/qr/scan";
import { qrPath } from "@/lib/qr/matrix";

const NOW = Date.parse("2026-05-01T10:00:00Z");
const seed = () => createSeed(NOW);

describe("scan logic", () => {
  it("maps a confirmed guest to valid, then already_used with who and when", async () => {
    const s = seed();
    const g = s.guests.find((x) => x.eventId === "e-1" && x.status === "confirmed" && !x.checkedInAt)!;
    const tok = await createToken("e-1", g.id);
    const a = await processScan(s, tok, "e-1", "u-staff", "2026-05-01T12:00:00.000Z");
    expect(a.view.result).toBe("valid");
    expect(a.view.guest?.checkedInAt).toBe("2026-05-01T12:00:00.000Z");
    const b = await processScan(a.state, tok, "e-1", "u-staff2", "2026-05-01T12:05:00.000Z");
    expect(b.view).toMatchObject({ result: "already_used", usedAt: "2026-05-01T12:00:00.000Z", usedBy: "u-staff" });
  });

  it("rejects tampered, foreign-event, unknown and unconfirmed codes with a reason and logs them", async () => {
    const s = seed();
    const conf = s.guests.find((x) => x.eventId === "e-1" && x.status === "confirmed")!;
    const declined = s.guests.find((x) => x.eventId === "e-1" && x.status === "declined")!;
    const tok = await createToken("e-1", conf.id);
    expect((await processScan(s, tamperToken(tok), "e-1", "u")).view.reason).toBe("unknown_code");
    expect((await processScan(s, "garbage", "e-1", "u")).view.reason).toBe("unknown_code");
    expect((await processScan(s, tok, "e-2", "u")).view.reason).toBe("wrong_event");
    expect((await processScan(s, await createToken("e-1", "nobody"), "e-1", "u")).view.reason).toBe("unknown_guest");
    const nc = await processScan(s, await createToken("e-1", declined.id), "e-1", "u");
    expect(nc.view).toMatchObject({ result: "invalid", reason: "not_confirmed" });
    expect(nc.state.scans.length).toBe(1);
    expect(nc.state.guests.find((g) => g.id === declined.id)?.checkedInAt).toBeUndefined();
  });

  it("accepts a full ticket URL", async () => {
    const s = seed();
    const g = s.guests.find((x) => x.eventId === "e-1" && x.status === "confirmed")!;
    const tok = await createToken("e-1", g.id);
    expect((await classifyCode(`https://x.test/ar/i/${tok}`, "e-1", s.guests)).reason).toBeUndefined();
  });

  it("applyCheckIn on a stale already-in guest reports already_used", () => {
    const s = seed();
    const g = s.guests.find((x) => x.eventId === "e-2" && x.checkedInAt)!;
    expect(applyCheckIn(s, "e-2", g.id, "u").view.result).toBe("already_used");
  });
});

describe("de-dupe window", () => {
  it("ignores the same code within 3s and allows other codes or later repeats", () => {
    expect(shouldProcess(null, "a", 1000)).toBe(true);
    expect(shouldProcess({ code: "a", at: 1000 }, "a", 3999)).toBe(false);
    expect(shouldProcess({ code: "a", at: 1000 }, "a", 4000)).toBe(true);
    expect(shouldProcess({ code: "a", at: 1000 }, "b", 1100)).toBe(true);
  });
});

describe("search and counters", () => {
  const s = seed();
  const guests = s.guests.filter((g) => g.eventId === "e-2");
  it("searches confirmed guests by name or phone only", () => {
    const g = guests.find((x) => x.status === "confirmed")!;
    expect(searchGuests(guests, g.name.slice(0, 4)).every((x) => x.status === "confirmed")).toBe(true);
    expect(searchGuests(guests, g.phone.slice(-6)).map((x) => x.id)).toContain(g.id);
    expect(searchGuests(guests, "a")).toEqual([]);
    const d = guests.find((x) => x.status === "declined")!;
    expect(searchGuests(guests, d.name).map((x) => x.id)).not.toContain(d.id);
  });
  it("counts attended, confirmed and people by party size", () => {
    const c = doorCounts(guests);
    expect(c.attended).toBeGreaterThan(0);
    expect(c.people).toBe(guests.filter((g) => g.checkedInAt).reduce((a, g) => a + g.partySize, 0));
    expect(c.confirmed).toBe(guests.filter((g) => g.status === "confirmed").length);
  });
});

describe("access", () => {
  const s = seed();
  it("staff see live events; hosts only their own; drafts never", () => {
    const staff = scannableEvents(s, { id: "u-staff", role: "staff" }, NOW).map((e) => e.id);
    expect(staff).toEqual(expect.arrayContaining(["e-1", "e-2"]));
    const host = scannableEvents(s, { id: "u-host", role: "host" }, NOW);
    expect(host.every((e) => e.ownerId === "u-host" && e.status !== "draft")).toBe(true);
    expect(scannableEvents(s, { id: "u-admin", role: "admin" }, NOW).every((e) => e.status !== "draft")).toBe(true);
  });
  it("computes the Riyadh day", () => {
    expect(riyadhDay("2026-05-01T22:30:00Z")).toBe("2026-05-02");
  });
});

describe("ics + maps", () => {
  it("builds a valid, CRLF, escaped calendar file", () => {
    const ics = buildIcs({ uid: "e-1-g", title: "Wedding, Nora; Mo", startsAt: "2026-05-11T16:00:00Z", venue: "Hall\nRiyadh", description: "x" }, new Date("2026-05-01T00:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("DTSTART:20260511T160000Z");
    expect(ics).toContain("DTEND:20260511T200000Z");
    expect(ics).toContain("SUMMARY:Wedding\\, Nora\; Mo");
    expect(ics).toContain("LOCATION:Hall\\nRiyadh");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  });
  it("prefers mapsUrl, else a search link from the venue", () => {
    expect(mapsLinkFor({ mapsUrl: "https://maps.app/x", venue: "V", city: "riyadh" })).toBe("https://maps.app/x");
    expect(mapsLinkFor({ venue: "Hall A, Riyadh", city: "riyadh" })).toBe("https://www.google.com/maps/search/?api=1&query=Hall%20A%2C%20Riyadh");
  });
});

describe("QR round trip", () => {
  it("renders a token and decodes it back with the jsQR fallback", async () => {
    const token = await createToken("e-1", "g1-001");
    // Render the QR modules (same matrix the component draws) to RGBA pixels with a quiet zone, scaled up.
    const qr = QRCode.create(token, { errorCorrectionLevel: "M" });
    const n = qr.modules.size, quiet = 4, scale = 6, dim = (n + quiet * 2) * scale;
    const data = new Uint8ClampedArray(dim * dim * 4).fill(255);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!qr.modules.get(y, x)) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const i = (((y + quiet) * scale + dy) * dim + (x + quiet) * scale + dx) * 4;
        data[i] = data[i + 1] = data[i + 2] = 20;
      }
    }
    expect(decodeQrFromImageData({ data, width: dim, height: dim })).toBe(token);
    expect(qrPath(token).size).toBe(n);
  });
});
