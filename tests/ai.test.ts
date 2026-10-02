import { describe, expect, it } from "vitest";
import { contrastRatio, ensureContrast, isHex } from "@/lib/ai/contrast";
import { adaptStub } from "@/lib/ai/stub";
import { adaptRequestSchema, adaptResultSchema } from "@/lib/ai/schema";
import { TEMPLATES } from "@/lib/templates/catalog";

const base = TEMPLATES[0];
const req = (theme: string, locale: "ar" | "en" = "en") => ({ theme, locale, template: { slug: base.slug, palette: base.palette }, hosts: "", headline: "" });

describe("contrast", () => {
  it("computes known ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });
  it("keeps good ink and fixes bad ink", () => {
    expect(ensureContrast("#14213d", "#fbf7ef")).toBe("#fbf7ef");
    const fixed = ensureContrast("#14213d", "#1a2a4a");
    expect(contrastRatio("#14213d", fixed)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#f2e9d8", ensureContrast("#f2e9d8", "#f0e0c0"))).toBeGreaterThanOrEqual(4.5);
  });
  it("validates hex", () => {
    expect(isHex("#aabbcc")).toBe(true);
    expect(isHex("aabbcc")).toBe(false);
    expect(isHex("#abc")).toBe(false);
  });
});

describe("adaptStub", () => {
  it("maps navy and gold (English)", () => {
    const r = adaptStub(req("navy and gold, Najdi style"));
    expect(r.palette.bg).toBe("#14213d");
    expect(r.palette.accent).toBe("#d9b061");
  });
  it("maps Arabic keywords", () => {
    const r = adaptStub(req("كحلي وذهبي بطابع نجدي", "ar"));
    expect(r.palette.bg).toBe("#14213d");
    expect(r.palette.accent).toBe("#d9b061");
    expect(r.headline).toMatch(/[؀-ۿ]/);
    expect(r.rationale).toContain("نجدي");
  });
  it("handles emerald, rose, sand and black", () => {
    expect(adaptStub(req("emerald green")).palette.bg).toBe("#17352b");
    expect(adaptStub(req("زمردي", "ar")).palette.bg).toBe("#17352b");
    expect(adaptStub(req("soft blush rose")).palette.bg).toBe("#f3dcd6");
    expect(adaptStub(req("beige")).palette.bg).toBe("#f2e9d8");
    expect(adaptStub(req("black and gold")).palette.bg).toBe("#121212");
  });
  it("gold alone gives a light card with gold accent", () => {
    const r = adaptStub(req("gold"));
    expect(r.palette.bg).toBe("#fbf7ef");
  });
  it("falls back to the template palette and always returns readable text", () => {
    const r = adaptStub(req("something unrelated"));
    expect(r.palette.bg).toBe(base.palette.bg);
    for (const t of ["navy", "gold", "emerald", "rose", "sand", "black", "najdi", "floral"]) {
      const p = adaptStub(req(t)).palette;
      expect(contrastRatio(p.bg, p.ink)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("produces output that satisfies the result schema", () => {
    expect(adaptResultSchema.safeParse(adaptStub(req("navy"))).success).toBe(true);
  });
});

describe("adaptRequestSchema", () => {
  it("rejects bad input", () => {
    expect(adaptRequestSchema.safeParse({ ...req("x"), theme: "" }).success).toBe(false);
    expect(adaptRequestSchema.safeParse({ ...req("navy"), locale: "fr" }).success).toBe(false);
    expect(adaptRequestSchema.safeParse(req("navy")).success).toBe(true);
  });
});
