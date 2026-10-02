import type { CardSpec } from "@/lib/templates/catalog";

export interface CardContent {
  eyebrow: string;
  title: string;
  host: string;
  date: string;
  venue: string;
}

/** Single renderer for invitation cards (landing, gallery, wizard, dashboard). */
export function InvitationCard({
  spec,
  content,
  className = "",
}: {
  spec: CardSpec;
  content: CardContent;
  className?: string;
}) {
  const { bg, ink, accent, frame } = spec.palette;
  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-[1.25rem] shadow-lift ${className}`}
      style={{ background: bg, color: ink }}
    >
      <div
        className="absolute inset-3 rounded-[0.85rem] border"
        style={{ borderColor: frame, opacity: 0.7 }}
      />
      <div className="absolute inset-5 rounded-[0.6rem] border" style={{ borderColor: frame, opacity: 0.35 }} />
      <div className="relative flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden="true">
          <path
            d="M16 2l3.6 6.2 7-2.6-2.6 7 6.2 3.6-6.2 3.6 2.6 7-7-2.6L16 30l-3.6-6.2-7 2.6 2.6-7L1.8 19.8l6.2-3.6-2.6-7 7 2.6z"
            fill="none"
            stroke={accent}
            strokeWidth="1.2"
          />
        </svg>
        <p className="text-xs tracking-[0.2em]" style={{ color: accent }}>
          {content.eyebrow}
        </p>
        <p className="font-display text-3xl font-bold leading-tight">{content.title}</p>
        <p className="text-sm opacity-80">{content.host}</p>
        <span className="my-1 h-px w-12" style={{ background: accent }} />
        <p className="text-sm font-medium">{content.date}</p>
        <p className="text-xs opacity-75">{content.venue}</p>
      </div>
      {spec.kind !== "static" && (
        <span
          className="absolute end-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: accent, color: bg }}
          aria-hidden="true"
        >
          ♪
        </span>
      )}
    </div>
  );
}
