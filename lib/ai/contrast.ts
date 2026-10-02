/** WCAG-style contrast helpers used to keep AI/preset palettes readable. */
const HEX = /^#[0-9a-fA-F]{6}$/;
export const isHex = (s: unknown): s is string => typeof s === "string" && HEX.test(s);

function channel(v: number) {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const isDark = (hex: string) => luminance(hex) < 0.3;

/** Returns `ink` if it already reads on `bg` (>= min), otherwise near-black or ivory, whichever contrasts more. */
export function ensureContrast(bg: string, ink: string, min = 4.5): string {
  if (contrastRatio(bg, ink) >= min) return ink;
  const light = "#fbf7ef";
  const dark = "#1c1511";
  return contrastRatio(bg, light) >= contrastRatio(bg, dark) ? light : dark;
}
