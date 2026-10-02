export type CardLang = "ar" | "en";

/** "Thursday, 3 December 2026 · 8:30 PM" in Riyadh time, Latin digits in Arabic too. */
export function formatEventDate(iso: string | Date, lang: CardLang, withTime = true): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const locale = lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB";
  const day = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Riyadh" }).format(d);
  if (!withTime) return day;
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh" }).format(d);
  return `${day} · ${time}`;
}

/** Riyadh is UTC+3 all year (no DST). `date` = yyyy-mm-dd, `time` = HH:mm. */
export function riyadhToIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
