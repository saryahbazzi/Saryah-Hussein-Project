/** Locale-aware formatters shared by the admin and clients screens (Riyadh time, Latin digits in Arabic). */
const intlLocale = (l: string) => (l === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB");

export function makeFormatters(locale: string) {
  const loc = intlLocale(locale);
  const date = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Riyadh" });
  const dateTime = new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" });
  const month = new Intl.DateTimeFormat(loc, { month: "short", timeZone: "Asia/Riyadh" });
  const monthLong = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric", timeZone: "Asia/Riyadh" });
  const num = new Intl.NumberFormat(loc);
  const compact = new Intl.NumberFormat(loc, { notation: "compact", maximumFractionDigits: 1 });
  const pct = new Intl.NumberFormat(loc, { style: "percent", maximumFractionDigits: 0 });
  /** "2026-05" -> a Date in the middle of that month (safe from timezone edges). */
  const keyToDate = (key: string) => new Date(`${key}-15T12:00:00Z`);
  return {
    date: (iso: string) => date.format(new Date(iso)),
    dateTime: (iso: string) => dateTime.format(new Date(iso)),
    month: (key: string) => month.format(keyToDate(key)),
    monthLong: (key: string) => monthLong.format(keyToDate(key)),
    num: (n: number) => num.format(n),
    compact: (n: number) => compact.format(n),
    pct: (n: number) => pct.format(n),
  };
}
export type Formatters = ReturnType<typeof makeFormatters>;
