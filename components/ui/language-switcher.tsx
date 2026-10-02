"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      lang={next}
      aria-label={t("switchLanguageLabel")}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-oud/20 px-4 text-sm font-semibold transition hover:bg-oud/5 ${className ?? ""}`}
    >
      {t("switchLanguage")}
    </button>
  );
}
