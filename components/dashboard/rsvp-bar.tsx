"use client";

import { useTranslations } from "next-intl";
import { SegmentBar } from "@/components/ui/primitives";
import { useFmt } from "./use-fmt";
import type { DemoGuest, GuestStats } from "@/lib/demo/types";

/** Confirmed / declined / awaiting / other split of a guest list as a segmented bar. */
export function RsvpBar({ stats, guests }: { stats: GuestStats; guests: DemoGuest[] }) {
  const t = useTranslations("dashboard.rsvp");
  const f = useFmt();
  const awaiting = guests.filter((g) => ["pending", "sent", "delivered"].includes(g.status)).length;
  const other = Math.max(0, stats.total - stats.confirmed - stats.declined - awaiting);
  return (
    <SegmentBar
      label={t("summary", { confirmed: f.num(stats.confirmed), declined: f.num(stats.declined), awaiting: f.num(awaiting), total: f.num(stats.total) })}
      segments={[
        { value: stats.confirmed, className: "bg-sage transition-[width] duration-700" },
        { value: stats.declined, className: "bg-rose transition-[width] duration-700" },
        { value: awaiting, className: "bg-navy/25 transition-[width] duration-700" },
        { value: other, className: "bg-oud-soft/30 transition-[width] duration-700" },
      ]}
    />
  );
}
