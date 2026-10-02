import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/ui/logo";
import { LoginForm } from "@/components/auth/login-form";
import { DemoLogin } from "@/components/auth/demo-login";
import { isSupabaseMode } from "@/lib/env";
import { safeNext } from "@/lib/auth/roles";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("title") };
}

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
  const defaultRole = role === "planner" ? "planner" : "host";

  return (
    <main className="pattern-star flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Logo name={brand} />
      <div className="mt-8 w-full max-w-md rounded-[2rem] border border-line bg-ivory/95 p-7 shadow-card sm:p-10">
        <h1 className="font-display text-3xl font-bold text-navy">{t("title")}</h1>
        <p className="mt-2 text-oud-soft">{t("lead")}</p>
        {isSupabaseMode() ? (
          <LoginForm next={safeNext(next)} defaultRole={defaultRole} />
        ) : (
          <DemoLogin next={safeNext(next)} defaultRole={defaultRole} />
        )}
      </div>
    </main>
  );
}
