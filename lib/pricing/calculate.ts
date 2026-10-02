import { PRICING, type PricingTier } from "./config";

export interface PriceBreakdown {
  tier: PricingTier;
  guests: number;
  base: number;
  guestsTotal: number;
  subtotal: number;
  vat: number;
  total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function clampGuests(n: number): number {
  if (!Number.isFinite(n)) return PRICING.minGuests;
  return Math.min(PRICING.maxGuests, Math.max(PRICING.minGuests, Math.floor(n)));
}

export function calculatePrice(tier: PricingTier, guests: number): PriceBreakdown {
  const g = clampGuests(guests);
  const base = PRICING.basePrice[tier];
  const guestsTotal = g * PRICING.perGuest;
  const subtotal = base + guestsTotal;
  const vat = round2(subtotal * PRICING.vatRate);
  return { tier, guests: g, base, guestsTotal, subtotal, vat, total: round2(subtotal + vat) };
}

export function formatSar(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-SA", {
    style: "currency",
    currency: PRICING.currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
