/**
 * Pricing constants. Change prices here only — the UI, checkout and
 * server-side order creation all read from this file.
 * All amounts are in SAR, excluding VAT.
 */
export const PRICING = {
  currency: "SAR",
  /** Flat per-event fee by invitation tier. Static = 150, animated/video = 200. */
  basePrice: { standard: 150, premium: 200 },
  /** Fee per invited guest. */
  perGuest: 2,
  /** Saudi VAT. */
  vatRate: 0.15,
  minGuests: 10,
  maxGuests: 5000,
} as const;

export type PricingTier = keyof typeof PRICING.basePrice;
