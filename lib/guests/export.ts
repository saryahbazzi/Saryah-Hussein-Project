import type { DemoGuest } from "@/lib/demo/types";

/** CSV export for guest lists (RFC 4180, UTF-8 BOM so Excel opens Arabic correctly). */

export const GUEST_CSV_COLUMNS = [
  "name", "phone", "partySize", "status", "sentAt", "deliveredAt", "respondedAt", "checkedInAt", "consentSource", "consentAt",
] as const;
export type GuestCsvColumn = (typeof GUEST_CSV_COLUMNS)[number];

const DEFAULT_LABELS: Record<GuestCsvColumn, string> = {
  name: "name", phone: "phone", partySize: "party size", status: "status", sentAt: "sent at", deliveredAt: "delivered at",
  respondedAt: "responded at", checkedInAt: "checked in at", consentSource: "consent source", consentAt: "consent at",
};

const BOM = "﻿";
// Spreadsheet apps evaluate cells starting with these characters as formulas (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_PHONE = /^\+\d{6,15}$/;

/** Neutralises formula injection, then quotes the cell if it contains a delimiter, quote or line break. */
export function csvCell(value: string | number | undefined | null, opts: { allowPlus?: boolean } = {}): string {
  let s = value === undefined || value === null ? "" : String(value);
  if (FORMULA_START.test(s) && !(opts.allowPlus && PLAIN_PHONE.test(s))) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildGuestCsv(guests: DemoGuest[], labels: Partial<Record<GuestCsvColumn, string>> = {}): string {
  const l = { ...DEFAULT_LABELS, ...labels };
  const header = GUEST_CSV_COLUMNS.map((c) => csvCell(l[c])).join(",");
  const rows = guests.map((g) =>
    [
      csvCell(g.name), csvCell(g.phone, { allowPlus: true }), csvCell(g.partySize), csvCell(g.status),
      csvCell(g.sentAt), csvCell(g.deliveredAt), csvCell(g.respondedAt), csvCell(g.checkedInAt),
      csvCell(g.consentSource), csvCell(g.consentAt),
    ].join(","),
  );
  return BOM + [header, ...rows].join("\r\n") + "\r\n";
}

/** Browser helper: triggers a file download for the given CSV text. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
