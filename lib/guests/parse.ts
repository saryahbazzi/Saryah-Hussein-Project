import Papa from "papaparse";
import { normalizeSaudiMobile, toLatinDigits } from "@/lib/phone/saudi";

/** Pure guest-list parsing: raw rows (CSV/Excel/paste) -> validated, de-duplicated guests. */

export type GuestIssue = "missing_name" | "invalid_phone" | "duplicate";

export interface GuestDraft { name: string; phone: string; partySize: number }
export interface ReviewedGuest extends GuestDraft {
  /** Normalized +9665XXXXXXXX, or null when invalid. */
  e164: string | null;
  issues: GuestIssue[];
}

export interface ParseResult {
  rows: ReviewedGuest[];
  headerDetected: boolean;
  /** Column indexes used, -1 when not found. */
  columns: { name: number; phone: number; size: number };
}

export const MAX_PARTY = 20;

const stripMarks = (s: string) =>
  s.replace(/^﻿/, "").replace(/[ً-ٰٟـ‎‏]/g, "").trim().toLowerCase();

type Col = "name" | "phone" | "size";

/** Classify a header cell. Name wins over size, size over phone ("number of guests" is a size). */
export function classifyHeader(cell: unknown): Col | null {
  const h = stripMarks(String(cell ?? "")).replace(/[أإآ]/g, "ا");
  if (!h) return null;
  if (/name|اسم|الضيف$|^guest$/.test(h)) return "name";
  if (/party|size|count|pax|guests|عدد|اشخاص/.test(h)) return "size";
  if (/phone|mobile|\btel\b|whatsapp|number|\bmob\b|جوال|موبايل|هاتف|واتساب|رقم|تلفون/.test(h)) return "phone";
  return null;
}

/** Excel hands back numbers; text may carry Arabic digits. Always return a trimmed string. */
export function cellText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(Math.round(v)) : "";
  return toLatinDigits(String(v)).trim();
}

export function parsePartySize(v: unknown): number {
  const n = parseInt(cellText(v).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_PARTY) : 1;
}

/** Validate drafts: flags missing names, invalid phones and repeated numbers (first one wins). */
export function reviewGuests(drafts: GuestDraft[]): ReviewedGuest[] {
  const seen = new Set<string>();
  return drafts.map((d) => {
    const name = d.name.trim();
    const e164 = normalizeSaudiMobile(cellText(d.phone));
    const issues: GuestIssue[] = [];
    if (!name) issues.push("missing_name");
    if (!e164) issues.push("invalid_phone");
    else if (seen.has(e164)) issues.push("duplicate");
    else seen.add(e164);
    return { name, phone: d.phone, partySize: Math.min(Math.max(1, d.partySize || 1), MAX_PARTY), e164, issues };
  });
}

export const isUsable = (g: ReviewedGuest) => g.issues.length === 0;

export function parseGuestRows(rawRows: unknown[][]): ParseResult {
  const rows = rawRows.filter((r) => Array.isArray(r) && r.some((c) => cellText(c) !== ""));
  const none = { name: -1, phone: -1, size: -1 };
  if (!rows.length) return { rows: [], headerDetected: false, columns: none };

  const cols = { ...none };
  let headerDetected = false;
  const head = rows[0].map(classifyHeader);
  // A header row has recognisable labels and no cell that is itself a valid phone number.
  if (head.some(Boolean) && !rows[0].some((c) => normalizeSaudiMobile(cellText(c)))) {
    headerDetected = true;
    head.forEach((c, i) => { if (c && cols[c] === -1) cols[c] = i; });
  }
  const body = headerDetected ? rows.slice(1) : rows;
  const width = Math.max(...rows.map((r) => r.length));

  if (cols.phone === -1) {
    // Headerless (or unlabeled phone column): pick the column holding the most valid numbers.
    let best = -1, bestScore = 0;
    for (let c = 0; c < width; c++) {
      if (c === cols.name || c === cols.size) continue;
      const score = body.filter((r) => normalizeSaudiMobile(cellText(r[c]))).length;
      if (score > bestScore) { best = c; bestScore = score; }
    }
    cols.phone = best;
  }
  if (cols.name === -1) {
    // Prefer a column that contains letters rather than digits.
    let pick = -1;
    for (let c = 0; c < width; c++) {
      if (c === cols.phone || c === cols.size) continue;
      if (body.some((r) => /[^\d\s+()\-]/.test(cellText(r[c])))) { pick = c; break; }
    }
    cols.name = pick;
  }
  if (cols.phone === -1 && width > 1) cols.phone = cols.name === 0 ? 1 : 0; // let validation flag them

  const drafts: GuestDraft[] = body.map((r) => ({
    name: cols.name >= 0 ? cellText(r[cols.name]) : "",
    phone: cols.phone >= 0 ? cellText(r[cols.phone]) : "",
    partySize: cols.size >= 0 ? parsePartySize(r[cols.size]) : 1,
  }));
  return { rows: reviewGuests(drafts), headerDetected, columns: cols };
}

/** CSV / pasted text -> raw rows. Handles BOM and comma, semicolon, tab or pipe delimiters. */
export function parseDelimitedText(text: string): unknown[][] {
  const clean = text.replace(/^﻿/, "");
  const res = Papa.parse<string[]>(clean, { delimiter: "", delimitersToGuess: [",", ";", "\t", "|"], skipEmptyLines: "greedy" });
  return res.data;
}

export const parseGuestText = (text: string) => parseGuestRows(parseDelimitedText(text));

export function sampleCsv(locale: "ar" | "en"): string {
  const header = locale === "ar" ? "الاسم,الجوال,عدد الضيوف" : "name,phone,guests";
  const rows = locale === "ar"
    ? ["محمد العتيبي,0501234567,2", "نورة القحطاني,0559876543,1", "فهد الدوسري,+966541112233,4"]
    : ["Mohammed Alotaibi,0501234567,2", "Noura Alqahtani,0559876543,1", "Fahad Aldosari,+966541112233,4"];
  return `﻿${[header, ...rows].join("\r\n")}\r\n`;
}
