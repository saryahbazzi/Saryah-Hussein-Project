/**
 * Saudi mobile numbers: +966 5X XXX XXXX (9 digits after the country code, starting with 5).
 * Accepts the formats people actually type or export from Excel, including Arabic-Indic digits.
 */
const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

export function toLatinDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : EASTERN_PERSIAN.indexOf(d));
  });
}

/** Returns +9665XXXXXXXX or null if the input is not a valid Saudi mobile number. */
export function normalizeSaudiMobile(input: string): string | null {
  let s = toLatinDigits(input).replace(/[\s\-().‎‏‪-‮]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  if (s.startsWith("00")) s = s.slice(2);
  if (s.startsWith("966")) s = s.slice(3);
  if (s.startsWith("0")) s = s.slice(1);
  return /^5\d{8}$/.test(s) ? `+966${s}` : null;
}

export function isSaudiMobile(input: string): boolean {
  return normalizeSaudiMobile(input) !== null;
}

/** +966501234567 -> "+966 50 123 4567" */
export function formatSaudiMobile(e164: string): string {
  const m = /^\+966(5\d)(\d{3})(\d{4})$/.exec(e164);
  return m ? `+966 ${m[1]} ${m[2]} ${m[3]}` : e164;
}
