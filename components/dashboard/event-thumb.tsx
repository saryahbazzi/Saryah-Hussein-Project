"use client";

import { InvitationCard } from "@/components/invitation/invitation-card";
import type { DemoEvent } from "@/lib/demo/types";
import { useCardProps } from "./use-card-props";

/** Miniature, non-interactive InvitationCard (rendered at 240px and scaled down so the typography stays proportional). */
export function EventThumb({ ev, className = "" }: { ev: DemoEvent; className?: string }) {
  const p = useCardProps(ev);
  return (
    <div aria-hidden="true" className={`relative h-32 w-24 shrink-0 overflow-hidden rounded-xl shadow-card ${className}`}>
      <div className="absolute start-0 top-0 w-60 origin-top-left scale-[0.4] rtl:origin-top-right">
        <InvitationCard spec={p.spec} palette={p.palette} content={p.content} lang={p.lang} animate={false} className="shadow-none" />
      </div>
    </div>
  );
}
