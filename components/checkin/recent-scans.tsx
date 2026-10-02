"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge, Card } from "@/components/ui/primitives";
import { formatTime } from "@/lib/door/format";
import type { ScanLog } from "@/lib/demo/types";

const TONE = { valid: "sage", already_used: "gold", invalid: "rose" } as const;
const KEY = { valid: "valid", already_used: "used", invalid: "invalid" } as const;
const ICON = { valid: "✓", already_used: "↺", invalid: "✕" } as const;

export function RecentScans({ scans, nameOf }: { scans: ScanLog[]; nameOf: (userId?: string) => string | undefined }) {
  const t = useTranslations("checkin.scanner.recent");
  const locale = useLocale();
  return (
    <Card>
      <h2 className="font-display text-2xl font-bold text-navy">{t("title")}</h2>
      {scans.length === 0 ? (
        <p className="mt-3 text-sm text-oud-soft">{t("empty")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {scans.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-semibold text-navy">{s.name ?? t("unknown")}</p>
                <p className="text-xs text-oud-soft">{formatTime(s.at, locale)}{nameOf(s.by) ? ` · ${nameOf(s.by)}` : ""}</p>
              </div>
              <Badge tone={TONE[s.result]}><span aria-hidden="true">{ICON[s.result]}</span>{t(KEY[s.result])}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
