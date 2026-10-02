"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import clsx from "clsx";
import { formatTime } from "@/lib/door/format";
import type { ScanView } from "@/lib/door/scan-logic";

const STYLE = {
  valid: "bg-sage text-white",
  already_used: "bg-amber-400 text-oud",
  invalid: "bg-rose text-white",
} as const;

function Icon({ result }: { result: ScanView["result"] }) {
  const common = { width: 56, height: 56, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (result === "valid") return <svg {...common}><path d="M4 12.5l5 5L20 6.5" /></svg>;
  if (result === "already_used") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.5l3.5 2" /></svg>;
  return <svg {...common}><path d="M6 6l12 12M18 6L6 18" /></svg>;
}

/** Full-width result: color + icon + text, held until the next scan or until dismissed. */
export function ResultBanner({ view, nameOf, onDismiss }: { view: ScanView; nameOf: (userId?: string) => string | undefined; onDismiss: () => void }) {
  const t = useTranslations("checkin.scanner.banner");
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const name = view.guest?.name ?? "";
  const party = view.guest ? t("party", { count: view.guest.partySize }) : "";
  const time = view.usedAt ? formatTime(view.usedAt, locale) : "";
  const reason = view.reason ? t(`reasons.${view.reason}`) : "";
  const by = nameOf(view.usedBy);

  useEffect(() => { ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [view]);

  const announce =
    view.result === "valid" ? t("announceValid", { name, party })
    : view.result === "already_used" ? t("announceUsed", { name, time })
    : t("announceInvalid", { reason });

  return (
    <div ref={ref}>
      <p className="sr-only" aria-live="assertive" aria-atomic="true">{announce}</p>
      <div className={clsx("rounded-3xl px-5 py-5 shadow-lift", STYLE[view.result])} data-result={view.result} data-testid="scan-banner">
        <div className="flex items-center gap-4">
          <Icon result={view.result} />
          <div className="min-w-0 flex-1">
            <p className="font-display text-4xl font-bold leading-none tracking-wide">
              {view.result === "valid" ? t("valid") : view.result === "already_used" ? t("used") : t("invalid")}
            </p>
            {view.result === "valid" && <p className="mt-1 text-lg font-semibold">{t("welcome")}</p>}
          </div>
        </div>
        <div className="mt-3 space-y-0.5">
          {view.guest && <p className="break-words text-2xl font-bold leading-snug">{name}</p>}
          {view.result === "valid" && <p className="text-lg font-semibold">{party}</p>}
          {view.result === "already_used" && (
            <>
              <p className="text-lg font-semibold">{party}</p>
              <p className="text-lg font-semibold">{t("usedAt", { time })}</p>
              {by && <p className="text-base">{t("usedBy", { name: by })}</p>}
            </>
          )}
          {view.result === "invalid" && <p className="text-lg font-semibold">{reason}</p>}
        </div>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onDismiss} className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-white/95 px-5 text-lg font-bold text-oud shadow-card">
            {t("scanNext")}
          </button>
          <button type="button" onClick={onDismiss} aria-label={t("dismiss")} className="inline-flex min-h-14 min-w-14 items-center justify-center rounded-2xl border-2 border-current/40 text-2xl font-bold">
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>
    </div>
  );
}
