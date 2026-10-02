"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { buildGuestCsv, downloadCsv, GUEST_CSV_COLUMNS, type GuestCsvColumn } from "@/lib/guests/export";
import type { DemoEvent, DemoGuest } from "@/lib/demo/types";
import { fileSlug } from "./event-utils";

/** Returns a function that downloads an event's guests as a localized CSV. */
export function useExportGuests() {
  const t = useTranslations("dashboard.export.columns");
  return useCallback(
    (ev: DemoEvent, guests: DemoGuest[]) => {
      const labels = Object.fromEntries(GUEST_CSV_COLUMNS.map((c) => [c, t(c)])) as Record<GuestCsvColumn, string>;
      downloadCsv(`${fileSlug(ev.title)}-guests.csv`, buildGuestCsv(guests, labels));
    },
    [t],
  );
}
