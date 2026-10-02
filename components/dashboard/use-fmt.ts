"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";

/**
 * Locale-aware formatters for the dashboard. Latin digits in both languages (matches phone numbers and prices),
 * Gregorian calendar and Riyadh time everywhere.
 */
export function useFmt() {
  const locale = useLocale();
  return useMemo(() => {
    const lang: "ar" | "en" = locale === "ar" ? "ar" : "en";
    const tag = lang === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB";
    const tz = { timeZone: "Asia/Riyadh" } as const;
    const numberFmt = new Intl.NumberFormat("en-US");
    const date = new Intl.DateTimeFormat(tag, { ...tz, weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const dateShort = new Intl.DateTimeFormat(tag, { ...tz, day: "numeric", month: "short" });
    const time = new Intl.DateTimeFormat(tag, { ...tz, hour: "2-digit", minute: "2-digit" });
    const dateTime = new Intl.DateTimeFormat(tag, { ...tz, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const full = new Intl.DateTimeFormat(tag, { ...tz, weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const d = (f: Intl.DateTimeFormat) => (iso: string) => f.format(new Date(iso));
    return {
      lang,
      num: (n: number) => numberFmt.format(n),
      date: d(date),
      dateShort: d(dateShort),
      time: d(time),
      dateTime: d(dateTime),
      full: d(full),
      compare: new Intl.Collator(tag).compare,
    };
  }, [locale]);
}

export type Fmt = ReturnType<typeof useFmt>;
