"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/primitives";
import type { EventStatus, GuestStatus } from "@/lib/demo/types";

type Tone = React.ComponentProps<typeof Badge>["tone"];

const PATHS: Record<string, string> = {
  pending: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  sent: "M5 12.5l4.5 4.5L19 7.5",
  delivered: "M2.5 12.5l4.5 4.5 9-10M11 16.5l1 1 9-10",
  confirmed: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12.5l3 3 5-6",
  declined: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9l6 6M15 9l-6 6",
  failed: "M12 4l9 16H3zM12 10v4M12 17.2v.1",
  opted_out: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.7 5.7l12.6 12.6",
  attended: "M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM10 8v10",
  live: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  draft: "M5 19l1-4L16 5l3 3L9 18zM14 7l3 3",
  done: "M5 12.5l4.5 4.5L19 7.5",
};

export function StatusIcon({ name, className = "h-3.5 w-3.5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.pending} />
    </svg>
  );
}

const GUEST_TONE: Record<GuestStatus, Tone> = {
  pending: "neutral", sent: "sky", delivered: "gold", confirmed: "sage", declined: "rose", failed: "rose", opted_out: "navy",
};

/** Colour + icon + text, so status never relies on colour alone. */
export function GuestStatusBadge({ status }: { status: GuestStatus }) {
  const t = useTranslations("dashboard.guestStatus");
  return (
    <Badge tone={GUEST_TONE[status]} className={status === "failed" ? "ring-1 ring-inset ring-rose/50" : undefined}>
      <StatusIcon name={status} />
      {t(status)}
    </Badge>
  );
}

const EVENT_TONE: Record<EventStatus, Tone> = { draft: "neutral", live: "sage", done: "sky" };

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const t = useTranslations("dashboard.eventStatus");
  return (
    <Badge tone={EVENT_TONE[status]}>
      <StatusIcon name={status} className={status === "live" ? "h-3 w-3 fill-current" : "h-3.5 w-3.5"} />
      {t(status)}
    </Badge>
  );
}
