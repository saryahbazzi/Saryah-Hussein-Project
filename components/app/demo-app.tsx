"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { canAccess, homeFor, type Role } from "@/lib/auth/roles";
import { resetDemo, signInAs, signOutDemo, useDemo, useDemoUser } from "@/lib/demo/store";

const NAV: Record<Role, { href: string; key: "events" | "newEvent" | "templates" | "clients" | "checkin" | "admin" }[]> = {
  host: [{ href: "/dashboard", key: "events" }, { href: "/events/new", key: "newEvent" }, { href: "/templates", key: "templates" }],
  planner: [{ href: "/dashboard", key: "events" }, { href: "/clients", key: "clients" }, { href: "/events/new", key: "newEvent" }, { href: "/templates", key: "templates" }],
  staff: [{ href: "/checkin", key: "checkin" }],
  admin: [{ href: "/admin", key: "admin" }, { href: "/dashboard", key: "events" }, { href: "/templates", key: "templates" }],
};

/** Client-side gate + shell for the signed-in area while the app runs on demo data. */
export function DemoApp({ children }: { children: React.ReactNode }) {
  const t = useTranslations("app");
  const brand = useTranslations("meta")("brand");
  const pathname = usePathname();
  const router = useRouter();
  const { ready, user } = useDemoUser();
  const { state } = useDemo();
  const area = pathname.split("/")[1] ?? "";
  const allowed = !!user && canAccess(area, user.role);

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!allowed) router.replace(homeFor(user.role));
  }, [ready, user, allowed, pathname, router]);

  if (!ready || !user || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory text-oud-soft" role="status">
        {t("demo.loading")}
      </div>
    );
  }

  const demoUsers = state.users.slice(0, 4);
  const nav = NAV[user.role];

  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-navy px-4 py-1.5 text-center text-xs text-ivory/90">{t("demo.banner")}</div>
      <header className="border-b border-line bg-ivory/95">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-2 sm:px-8">
          <Logo name={brand} />
          <nav aria-label={t("nav.main")} className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
            {nav.map((n) => {
              const active = pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href)) || (n.href === "/dashboard" && pathname.startsWith("/dashboard"));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx("inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition", active ? "bg-navy text-ivory" : "text-oud-soft hover:bg-oud/5")}
                >
                  {t(`nav.${n.key}`)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <details className="group relative">
              <summary
                aria-label={t("demo.account")}
                className="flex h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-1.5 rounded-full border border-oud/20 bg-white px-3 text-sm font-semibold text-navy [&::-webkit-details-marker]:hidden"
              >
                <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs text-ivory">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{t(`roles.${user.role}`)}</span>
                <span aria-hidden="true" className="text-xs transition group-open:rotate-180">▾</span>
              </summary>
              <div className="absolute end-0 z-50 mt-2 w-72 max-w-[calc(100vw-2.5rem)] rounded-3xl border border-line bg-ivory p-3 shadow-lift">
                <p className="px-3 pb-2 pt-1 text-xs font-semibold text-oud-soft">{t("demo.switchRole")}</p>
                <ul>
                  {demoUsers.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        aria-current={u.id === user.id ? "true" : undefined}
                        onClick={(e) => {
                          signInAs(u.id);
                          e.currentTarget.closest("details")?.removeAttribute("open");
                          router.push(homeFor(u.role));
                        }}
                        className={clsx("flex min-h-12 w-full flex-col items-start justify-center rounded-2xl px-3 text-start", u.id === user.id ? "bg-navy text-ivory" : "hover:bg-sand")}
                      >
                        <span className="text-sm font-semibold">{t(`roles.${u.role}`)}</span>
                        <span className={clsx("text-xs", u.id === user.id ? "text-ivory/75" : "text-oud-soft")}><bdi>{u.name}</bdi></span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-col border-t border-line pt-2">
                  <button type="button" className="min-h-11 rounded-2xl px-3 text-start text-sm font-semibold text-oud-soft hover:bg-sand"
                    onClick={() => { if (window.confirm(t("demo.reset") + "?")) resetDemo(); }}>
                    {t("demo.reset")}
                  </button>
                  <button type="button" className="min-h-11 rounded-2xl px-3 text-start text-sm font-semibold text-rose hover:bg-sand"
                    onClick={() => { signOutDemo(); router.replace("/login"); }}>
                    {t("signOut")}
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
