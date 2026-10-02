import { isHex } from "@/lib/ai/contrast";
import { OCCASIONS, type Occasion, type Palette } from "@/lib/templates/catalog";
import type { City, EventLanguage } from "@/lib/demo/types";
import type { GuestDraft } from "@/lib/guests/parse";
import { riyadhToIso } from "@/components/templates/format";

export const STEPS = ["details", "template", "customize", "guests", "preview", "summary", "checkout"] as const;
export type StepId = (typeof STEPS)[number];

export const PAYMENT_METHODS = ["mada", "applePay", "stcPay", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface DetailsState {
  title: string;
  occasion: Occasion;
  date: string;
  time: string;
  venue: string;
  city: City;
  mapsUrl: string;
  clientId: string;
}

export interface CustomizeState {
  hosts: string;
  headline: string;
  message: string;
  language: EventLanguage;
  /** null = use the template's own palette. */
  palette: Palette | null;
}

export interface WizardState {
  step: number;
  details: DetailsState;
  templateSlug: string | null;
  showAllTemplates: boolean;
  custom: CustomizeState;
  guests: GuestDraft[];
  consent: boolean;
  payment: PaymentMethod;
}

export const initialState = (): WizardState => ({
  step: 0,
  details: { title: "", occasion: "wedding", date: "", time: "20:00", venue: "", city: "riyadh", mapsUrl: "", clientId: "" },
  templateSlug: null,
  showAllTemplates: false,
  custom: { hosts: "", headline: "", message: "", language: "ar", palette: null },
  guests: [],
  consent: false,
  payment: "mada",
});

export type PresetId = "navyGold" | "emerald" | "blush" | "sand" | "midnight" | "ivory";
export const PALETTE_PRESETS: { id: PresetId; palette: Palette }[] = [
  { id: "navyGold", palette: { bg: "#14213d", ink: "#fbf7ef", accent: "#d9b061", frame: "#d9b061" } },
  { id: "emerald", palette: { bg: "#17352b", ink: "#f7f1e3", accent: "#d9b061", frame: "#d9b061" } },
  { id: "blush", palette: { bg: "#f3dcd6", ink: "#4a1f1c", accent: "#9a4a45", frame: "#9a4a45" } },
  { id: "sand", palette: { bg: "#f2e9d8", ink: "#2a1f17", accent: "#7d5a17", frame: "#b8893b" } },
  { id: "midnight", palette: { bg: "#241a14", ink: "#f2e9d8", accent: "#d9b061", frame: "#5b4a3c" } },
  { id: "ivory", palette: { bg: "#fbf7ef", ink: "#14213d", accent: "#b8893b", frame: "#b8893b" } },
];

export type ErrorKey =
  | "titleRequired" | "occasionInvalid" | "dateRequired" | "timeRequired" | "dateInvalid" | "dateFuture"
  | "venueRequired" | "mapsInvalid" | "templateRequired" | "hostsRequired" | "headlineRequired"
  | "paletteInvalid" | "noGuests" | "consentRequired";
export type Errors<K extends string> = Partial<Record<K, ErrorKey>>;
export type DetailsField = "title" | "date" | "time" | "venue" | "mapsUrl";

export function isGoogleMapsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const h = u.hostname.toLowerCase();
    return h === "goo.gl" || h.endsWith(".goo.gl") || h === "maps.app.goo.gl" || /(^|\.)google\.[a-z.]+$/.test(h);
  } catch {
    return false;
  }
}

/** Returns message keys under `wizard.errors`. An empty object means the step is valid. */
export function validateDetails(d: DetailsState, now = Date.now()): Errors<DetailsField> {
  const e: Errors<DetailsField> = {};
  if (d.title.trim().length < 2) e.title = "titleRequired";
  if (!d.date) e.date = "dateRequired";
  if (!d.time) e.time = "timeRequired";
  if (d.date && d.time) {
    const iso = riyadhToIso(d.date, d.time);
    if (!iso) e.date = "dateInvalid";
    else if (new Date(iso).getTime() <= now) e.date = "dateFuture";
  }
  if (d.venue.trim().length < 2) e.venue = "venueRequired";
  if (d.mapsUrl.trim() && !isGoogleMapsUrl(d.mapsUrl.trim())) e.mapsUrl = "mapsInvalid";
  if (!OCCASIONS.includes(d.occasion)) e.title = e.title ?? "occasionInvalid";
  return e;
}

export type CustomizeField = "hosts" | "headline" | "palette";
export function validateCustomize(c: CustomizeState, fallback: Palette): Errors<CustomizeField> {
  const e: Errors<CustomizeField> = {};
  if (c.hosts.trim().length < 2) e.hosts = "hostsRequired";
  if (c.headline.trim().length < 2) e.headline = "headlineRequired";
  const p = c.palette ?? fallback;
  if (![p.bg, p.ink, p.accent, p.frame].every(isHex)) e.palette = "paletteInvalid";
  return e;
}
