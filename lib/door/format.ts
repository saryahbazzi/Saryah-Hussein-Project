/** Date/time helpers pinned to Riyadh time; Arabic uses Latin digits to match phone numbers and prices. */
const tag = (locale: string) => (locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB");

export const formatLongDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(tag(locale), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Riyadh" }).format(new Date(iso));

export const formatShortDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(tag(locale), { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Riyadh" }).format(new Date(iso));

export const formatTime = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(tag(locale), { hour: "2-digit", minute: "2-digit", hour12: locale !== "ar" ? false : true, timeZone: "Asia/Riyadh" }).format(new Date(iso));
