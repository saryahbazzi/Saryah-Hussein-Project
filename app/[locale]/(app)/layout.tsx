import { setRequestLocale } from "next-intl/server";
import { AppShell } from "@/components/app/app-shell";
import { getSession } from "@/lib/auth/session";
import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect({ href: "/login", locale });
  return <AppShell session={session!} locale={locale}>{children}</AppShell>;
}
