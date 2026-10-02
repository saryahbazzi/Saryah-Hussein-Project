import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/auth/login-form";
import { supabaseConfigured } from "@/lib/env";
import { getSession } from "@/lib/auth/session";
import { homeFor, safeNext } from "@/lib/auth/roles";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("title") };
}

export const dynamic = "force-dynamic";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; role?: string }>;
}) {
  const { locale } = await params;
  const { next, role } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const brand = (await getTranslations("meta"))("brand");

  const session = await getSession();
  if (session) redirect({ href: safeNext(next) ?? homeFor(session.role), locale });

  return (
    <main className="pattern-star flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Logo name={brand} />
      <div className="mt-8 w-full max-w-md rounded-[2rem] border border-line bg-ivory/95 p-7 shadow-card sm:p-10">
        <h1 className="font-display text-3xl font-bold text-navy">{t("title")}</h1>
        <p className="mt-2 text-oud-soft">{t("lead")}</p>
        {supabaseConfigured() ? (
          <LoginForm next={safeNext(next)} defaultRole={role === "planner" ? "planner" : "host"} />
        ) : (
          <p role="alert" className="mt-6 rounded-2xl bg-sand p-4 text-sm text-oud">
            {t("notConfigured")}
          </p>
        )}
      </div>
    </main>
  );
}
