"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ButtonLink } from "@/components/ui/button";

const NAV = [
  { key: "how", href: "/#how" },
  { key: "templates", href: "/#templates" },
  { key: "planners", href: "/#planners" },
  { key: "pricing", href: "/#pricing" },
  { key: "faq", href: "/#faq" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const brand = useTranslations("meta")("brand");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-2 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-ivory"
      >
        {t("skip")}
      </a>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Logo name={brand} />
        <nav aria-label={t("label")} className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} className="text-sm font-medium text-oud-soft hover:text-navy">
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/login" className="hidden px-3 text-sm font-medium text-oud-soft hover:text-navy sm:inline">
            {t("login")}
          </Link>
          <ButtonLink href="/events/new" className="max-sm:!hidden !min-h-11 !px-5">
            {t("cta")}
          </ButtonLink>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-oud/20 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t("menu")}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M3 3l12 12M15 3L3 15" /> : <path d="M2 5h14M2 9h14M2 13h14" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label={t("label")} className="border-t border-line bg-ivory px-5 pb-6 pt-3 lg:hidden">
          <ul className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.key}>
                <Link href={n.href} onClick={() => setOpen(false)} className="block border-b border-line/60 py-3.5 text-base font-medium">
                  {t(n.key)}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-3">
            <ButtonLink href="/events/new" className="flex-1">{t("cta")}</ButtonLink>
            <ButtonLink href="/login" variant="ghost">{t("login")}</ButtonLink>
          </div>
        </nav>
      )}
    </header>
  );
}
