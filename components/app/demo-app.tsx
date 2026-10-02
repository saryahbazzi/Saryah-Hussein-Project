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
        <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-2 sm:px-8">
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
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <label className="sr-only" htmlFor="role-switch">{t("demo.switchRole")}</label>
            <select
              id="role-switch"
              value={user.id}
              onChange={(e) => {
                signInAs(e.target.value);
                const next = state.users.find((u) => u.id === e.target.value);
                if (next) router.push(homeFor(next.role));
              }}
              className="min-h-11 max-w-[11rem] rounded-full border border-oud/20 bg-ivory px-3 text-sm font-semibold"
            >
              {demoUsers.map((u) => (
                <option key={u.id} value={u.id}>{t(`roles.${u.role}`)} · {u.name}</option>
              ))}
            </select>
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => { signOutDemo(); router.replace("/login"); }}
              className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-oud-soft hover:bg-oud/5"
            >
              {t("signOut")}
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      <footer className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
        <button
          type="button"
          className="text-xs font-medium text-oud-soft underline"
          onClick={() => { if (window.confirm(t("demo.reset") + "?")) resetDemo(); }}
        >
          {t("demo.reset")}
        </button>
      </footer>
    </div>
  );
}
