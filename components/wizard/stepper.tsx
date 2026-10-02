"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import { STEPS } from "./model";

export function Stepper({ current, onJump }: { current: number; onJump: (i: number) => void }) {
  const t = useTranslations("wizard");
  const total = STEPS.length;
  return (
    <nav aria-label={t("progress.label")}>
      {/* Mobile: compact label + bar */}
      <div className="md:hidden">
        <p className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-navy">{t(`steps.${STEPS[current]}`)}</span>
          <span className="text-oud-soft">{t("progress.step", { current: current + 1, total })}</span>
        </p>
        <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-valuetext={t("progress.step", { current: current + 1, total })} className="mt-2 h-2 overflow-hidden rounded-full bg-sand-deep/60">
          <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${((current + 1) / total) * 100}%` }} />
        </div>
      </div>
      {/* Desktop: full stepper */}
      <ol className="hidden items-center md:flex">
        {STEPS.map((s, i) => {
          const done = i < current;
          return (
            <li key={s} className={clsx("flex items-center", i < total - 1 && "flex-1")}>
              <button
                type="button"
                disabled={!done}
                onClick={() => onJump(i)}
                aria-current={i === current ? "step" : undefined}
                className={clsx("group flex min-h-11 items-center gap-2 rounded-full pe-2 text-sm font-semibold", done ? "cursor-pointer text-navy" : i === current ? "text-navy" : "text-oud-soft")}
              >
                <span aria-hidden="true" className={clsx("inline-flex size-8 shrink-0 items-center justify-center rounded-full border text-xs", done ? "border-sage bg-sage text-white" : i === current ? "border-navy bg-navy text-ivory" : "border-line bg-white")}>
                  {done ? "✓" : i + 1}
                </span>
                <span className={clsx(i !== current && "hidden xl:inline")}>{t(`steps.${s}`)}</span>
                {done && <span className="sr-only">{t("progress.done")}</span>}
              </button>
              {i < total - 1 && <span aria-hidden="true" className={clsx("mx-2 h-px flex-1", done ? "bg-sage" : "bg-line")} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
