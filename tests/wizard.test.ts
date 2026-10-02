import { describe, expect, it } from "vitest";
import { initialState, isGoogleMapsUrl, validateCustomize, validateDetails } from "@/components/wizard/model";

const now = Date.parse("2026-10-02T10:00:00Z");
const good = { ...initialState().details, title: "Wedding", date: "2026-12-03", venue: "Hall" };

describe("validateDetails", () => {
  it("accepts a complete future event", () => expect(validateDetails(good, now)).toEqual({}));
  it("requires title, date and venue", () => {
    const e = validateDetails({ ...good, title: "", date: "", venue: "" }, now);
    expect(Object.keys(e).sort()).toEqual(["date", "title", "venue"]);
  });
  it("rejects past dates", () => expect(validateDetails({ ...good, date: "2026-10-01" }, now).date).toBe("dateFuture"));
  it("treats time in Riyadh (UTC+3)", () => {
    // 12:59 UTC = 15:59 Riyadh
    const n = Date.parse("2026-10-02T12:59:00Z");
    expect(validateDetails({ ...good, date: "2026-10-02", time: "15:30" }, n).date).toBe("dateFuture");
    expect(validateDetails({ ...good, date: "2026-10-02", time: "16:30" }, n).date).toBeUndefined();
  });
  it("validates the optional maps link", () => {
    expect(validateDetails({ ...good, mapsUrl: "https://maps.app.goo.gl/abc" }, now).mapsUrl).toBeUndefined();
    expect(validateDetails({ ...good, mapsUrl: "not a url" }, now).mapsUrl).toBe("mapsInvalid");
    expect(isGoogleMapsUrl("https://evil.example.com/maps")).toBe(false);
    expect(isGoogleMapsUrl("https://www.google.com/maps/place/x")).toBe(true);
  });
});

describe("validateCustomize", () => {
  const pal = { bg: "#000000", ink: "#ffffff", accent: "#d9b061", frame: "#d9b061" };
  it("requires hosts and headline", () => {
    const e = validateCustomize({ hosts: "", headline: "", message: "", language: "ar", palette: null }, pal);
    expect(Object.keys(e).sort()).toEqual(["headline", "hosts"]);
  });
  it("rejects invalid hex", () => {
    expect(validateCustomize({ hosts: "A & B", headline: "Hi", message: "", language: "en", palette: { ...pal, bg: "red" } }, pal).palette).toBe("paletteInvalid");
  });
});
