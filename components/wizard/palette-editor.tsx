"use client";

import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { Palette } from "@/lib/templates/catalog";
import { contrastRatio, isHex } from "@/lib/ai/contrast";
import { PALETTE_PRESETS } from "./model";

const FIELDS = ["bg", "ink", "accent", "frame"] as const;
const same = (a: Palette, b: Palette) => FIELDS.every((k) => a[k].toLowerCase() === b[k].toLowerCase());

export function PaletteEditor({ palette, base, onChange }: { palette: Palette; base: Palette; onChange: (p: Palette | null) => void }) {
  const t = useTranslations("wizard.customize.palette");
  const ratio = isHex(palette.bg) && isHex(palette.ink) ? contrastRatio(palette.bg, palette.ink) : null;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-navy">{t("presets")}</p>
        <ul className="flex flex-wrap gap-3">
          <li>
            <button type="button" aria-pressed={same(palette, base)} onClick={() => onChange(null)} className={clsx("flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold", same(palette, base) ? "border-navy bg-navy text-ivory" : "border-line bg-white hover:border-gold")}>
              <Swatch p={base} />{t("original")}
            </button>
          </li>
          {PALETTE_PRESETS.map((pr) => (
            <li key={pr.id}>
              <button type="button" aria-pressed={same(palette, pr.palette)} onClick={() => onChange(pr.palette)} className={clsx("flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm font-semibold", same(palette, pr.palette) ? "border-navy bg-navy text-ivory" : "border-line bg-white hover:border-gold")}>
                <Swatch p={pr.palette} />{t(`names.${pr.id}`)}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {FIELDS.map((k) => (
          <label key={k} className="block">
            <span className="mb-1.5 block text-sm font-semibold text-navy">{t(`fields.${k}`)}</span>
            <span className="flex min-h-12 items-center gap-2 rounded-2xl border border-line bg-white px-2">
              <input type="color" value={isHex(palette[k]) ? palette[k] : "#000000"} onChange={(e) => onChange({ ...palette, [k]: e.target.value })} className="size-9 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
              <span dir="ltr" className="text-xs tabular-nums text-oud-soft">{palette[k].toUpperCase()}</span>
            </span>
          </label>
        ))}
      </div>
      {ratio !== null && ratio < 4.5 && <p role="status" className="rounded-xl bg-gold-bright/25 p-3 text-sm text-oud">{t("lowContrast", { ratio: ratio.toFixed(1) })}</p>}
    </div>
  );
}

function Swatch({ p }: { p: Palette }) {
  return (
    <span aria-hidden="true" className="relative inline-block size-6 overflow-hidden rounded-full border border-oud/20" style={{ background: p.bg }}>
      <span className="absolute inset-x-0 bottom-0 h-2/5" style={{ background: p.accent }} />
    </span>
  );
}
