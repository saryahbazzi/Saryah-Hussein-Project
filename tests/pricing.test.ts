import { describe, expect, it } from "vitest";
import { calculatePrice, clampGuests } from "@/lib/pricing/calculate";

describe("calculatePrice", () => {
  it("computes standard tier with VAT", () => {
    const p = calculatePrice("standard", 100);
    expect(p.subtotal).toBe(350);
    expect(p.vat).toBe(52.5);
    expect(p.total).toBe(402.5);
  });
  it("computes premium tier", () => {
    expect(calculatePrice("premium", 200).subtotal).toBe(600);
  });
  it("clamps guest counts", () => {
    expect(clampGuests(1)).toBe(10);
    expect(clampGuests(99999)).toBe(5000);
    expect(clampGuests(NaN)).toBe(10);
  });
});
