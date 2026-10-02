import type { Occasion, Palette, TemplateKind } from "@/lib/templates/catalog";
import type { PricingTier } from "@/lib/pricing/config";
import type { Role } from "@/lib/auth/roles";

export type GuestStatus = "pending" | "sent" | "delivered" | "confirmed" | "declined" | "failed" | "opted_out";
export type EventStatus = "draft" | "live" | "done";
export type City = "riyadh" | "jeddah";
export type EventLanguage = "ar" | "en" | "both";
export type MessageKindName = "invite" | "reminder_7d" | "reminder_1d" | "ticket" | "reply";
export type MessageStatus = "queued" | "sent" | "delivered" | "read" | "failed" | "received";

export interface DemoUser {
  id: string;
  name: string;
  role: Role;
  email: string;
  phone: string;
  /** Planner agency name, if any. */
  org?: string;
  createdAt: string;
}

/** A planner's customer (sub-account). */
export interface DemoClient { id: string; plannerId: string; name: string; contact: string }

export interface Customization {
  hosts: string;
  headline: string;
  message: string;
  palette: Palette;
  language: EventLanguage;
}

export interface DemoEvent {
  id: string;
  ownerId: string;
  clientId?: string;
  title: string;
  occasion: Occasion;
  startsAt: string;
  venue: string;
  city: City;
  mapsUrl?: string;
  templateSlug: string;
  customization: Customization;
  status: EventStatus;
  createdAt: string;
  consentAttestedAt?: string;
}

export interface DemoGuest {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  partySize: number;
  status: GuestStatus;
  sentAt?: string;
  deliveredAt?: string;
  respondedAt?: string;
  checkedInAt?: string;
  checkedInBy?: string;
  consentAt: string;
  consentSource: "host_attested" | "guest_opt_in";
  error?: string;
}

export interface DemoMessage {
  id: string;
  eventId: string;
  guestId: string;
  kind: MessageKindName;
  status: MessageStatus;
  providerMessageId?: string;
  text: string;
  createdAt: string;
}

export interface DemoOrder {
  id: string;
  eventId: string;
  ownerId: string;
  tier: PricingTier;
  guests: number;
  base: number;
  guestsTotal: number;
  vat: number;
  total: number;
  status: "paid" | "pending";
  createdAt: string;
}

export interface DemoTemplate {
  slug: string;
  occasion: Occasion;
  style: string;
  kind: TemplateKind;
  motif: string;
  palette: Palette;
  name: { ar: string; en: string };
  published: boolean;
}

export interface ScanLog {
  id: string;
  eventId: string;
  guestId?: string;
  name?: string;
  result: "valid" | "already_used" | "invalid";
  by: string;
  at: string;
}

export interface DemoState {
  version: 1;
  users: DemoUser[];
  clients: DemoClient[];
  events: DemoEvent[];
  guests: DemoGuest[];
  messages: DemoMessage[];
  orders: DemoOrder[];
  templates: DemoTemplate[];
  scans: ScanLog[];
}

export interface GuestStats {
  total: number;
  sent: number;
  delivered: number;
  confirmed: number;
  declined: number;
  pending: number;
  attended: number;
}
