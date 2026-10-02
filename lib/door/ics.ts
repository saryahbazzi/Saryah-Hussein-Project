import type { DemoEvent } from "@/lib/demo/types";

export interface IcsInput { uid: string; title: string; startsAt: string; venue: string; description?: string; hours?: number }

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Fold lines to 75 octets as RFC 5545 requires (counted in characters, a safe approximation for BMP text). */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = " " + rest.slice(74); }
  out.push(rest);
  return out.join("\r\n");
}

export function buildIcs(i: IcsInput, now = new Date()): string {
  const start = new Date(i.startsAt);
  const end = new Date(start.getTime() + (i.hours ?? 4) * 3600_000);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dawati//Invitation//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${i.uid}@dawati.app`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(i.title)}`,
    `LOCATION:${esc(i.venue)}`,
    ...(i.description ? [`DESCRIPTION:${esc(i.description)}`] : []),
    "END:VEVENT", "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** The host's maps link, or a Google Maps search built from venue and city. */
export function mapsLinkFor(ev: Pick<DemoEvent, "mapsUrl" | "venue" | "city">): string {
  if (ev.mapsUrl) return ev.mapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.venue)}`;
}
