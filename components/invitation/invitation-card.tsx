import clsx from "clsx";
import type { CardSpec, Motif, Palette } from "@/lib/templates/catalog";

export interface CardContent {
  eyebrow: string;
  title: string;
  host: string;
  date: string;
  venue: string;
  /** Optional personal line shown under the host names. */
  message?: string;
}

const STAR = "M16 2l3.6 6.2 7-2.6-2.6 7 6.2 3.6-6.2 3.6 2.6 7-7-2.6L16 30l-3.6-6.2-7 2.6 2.6-7L1.8 19.8l6.2-3.6-2.6-7 7 2.6z";

function Star({ size, color, className, fill = false }: { size: number; color: string; className?: string; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d={STAR} fill={fill ? color : "none"} stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

function MotifLayer({ motif, p }: { motif: Motif; p: Palette }) {
  const c = p.accent;
  switch (motif) {
    case "star":
      return (
        <>
          <Star size={26} color={c} className="absolute start-6 top-6 opacity-60" />
          <Star size={26} color={c} className="absolute end-6 top-6 opacity-60" />
          <Star size={26} color={c} className="absolute bottom-6 start-6 opacity-60" />
          <Star size={26} color={c} className="absolute bottom-6 end-6 opacity-60" />
        </>
      );
    case "arch":
      return (
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
          <path d="M12 133V52a38 38 0 0 1 76 0v81" fill="none" stroke={c} strokeWidth="0.5" opacity="0.6" />
          <path d="M18 133V54a32 32 0 0 1 64 0v79" fill="none" stroke={c} strokeWidth="0.25" opacity="0.4" />
        </svg>
      );
    case "floral":
      return (
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {[[10, 10], [90, 10], [10, 123], [90, 123]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`} fill={c} opacity="0.35">
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <ellipse key={a} cx="0" cy="-7" rx="3.2" ry="6.5" transform={`rotate(${a})`} />
              ))}
              <circle r="2.4" opacity="0.8" />
            </g>
          ))}
        </svg>
      );
    case "lines":
      return (
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
          {[14, 18].map((y) => <line key={y} x1="10" x2="90" y1={y} y2={y} stroke={c} strokeWidth="0.3" opacity="0.6" />)}
          {[115, 119].map((y) => <line key={y} x1="10" x2="90" y1={y} y2={y} stroke={c} strokeWidth="0.3" opacity="0.6" />)}
          {Array.from({ length: 8 }).map((_, i) => (
            <path key={i} d={`M${14 + i * 10} 14l5 -5 5 5z`} fill={c} opacity="0.35" />
          ))}
        </svg>
      );
    case "dots":
      return (
        <svg viewBox="0 0 100 133" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <circle key={i} cx={(i * 37) % 92 + 4} cy={(i * 53) % 125 + 4} r={0.8 + (i % 3) * 0.5} fill={c} opacity={0.2 + (i % 4) * 0.1} />
          ))}
        </svg>
      );
  }
}

/** Single renderer for invitation cards (landing, gallery, wizard, dashboard, guest ticket). */
export function InvitationCard({
  spec,
  content,
  palette,
  className = "",
  animate = true,
  lang = "ar",
}: {
  spec: Pick<CardSpec, "kind" | "motif" | "palette">;
  content: CardContent;
  /** Overrides the template palette (customize step, AI adaptation). */
  palette?: Palette;
  className?: string;
  animate?: boolean;
  lang?: "ar" | "en";
}) {
  const p = palette ?? spec.palette;
  const animated = animate && spec.kind !== "static";
  return (
    <div
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className={clsx("relative aspect-[3/4] w-full overflow-hidden rounded-[1.25rem] shadow-lift", className)}
      style={{ background: p.bg, color: p.ink }}
    >
      <MotifLayer motif={spec.motif} p={p} />
      <div className="absolute inset-3 rounded-[0.85rem] border" style={{ borderColor: p.frame, opacity: 0.7 }} />
      <div className="absolute inset-5 rounded-[0.6rem] border" style={{ borderColor: p.frame, opacity: 0.35 }} />
      {animated && <span className="card-shimmer pointer-events-none absolute inset-0" aria-hidden="true" />}
      <div className={clsx("relative flex h-full flex-col items-center justify-center gap-3 px-9 text-center", animated && "card-stagger")}>
        <Star size={40} color={p.accent} fill={spec.motif === "star"} />
        <p className="text-[0.7rem] tracking-[0.18em]" style={{ color: p.accent }}>{content.eyebrow}</p>
        <p className={clsx("font-bold leading-tight", lang === "ar" ? "font-display-ar text-3xl" : "font-display-en text-4xl")}>
          {content.title}
        </p>
        <p className="text-sm opacity-85">{content.host}</p>
        {content.message && <p className="max-w-[16rem] text-xs italic opacity-75">{content.message}</p>}
        <span className="my-1 h-px w-12" style={{ background: p.accent }} />
        <p className="text-sm font-medium">{content.date}</p>
        <p className="text-xs opacity-75">{content.venue}</p>
      </div>
      {spec.kind !== "static" && (
        <span
          className="absolute end-4 top-4 inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold"
          style={{ background: p.accent, color: p.bg }}
          aria-hidden="true"
        >
          {spec.kind === "video" ? "▶" : "♪"}
        </span>
      )}
    </div>
  );
}
