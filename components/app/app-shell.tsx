import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import type { SessionProfile } from "@/lib/auth/session";

export async function AppShell({
  session,
  locale,
  children,
}: {
  session: SessionProfile;
  locale: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("app");
  const brand = (await getTranslations("meta"))("brand");
  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-line bg-ivory/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <Logo name={brand} />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-oud-soft sm:inline">
              {session.fullName ?? session.email ?? session.phone}
              <span className="ms-2 rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-navy">
                {t(`roles.${session.role}`)}
              </span>
            </span>
            <LanguageSwitcher />
            <form action="/auth/signout" method="post">
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-oud-soft hover:bg-oud/5">
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
