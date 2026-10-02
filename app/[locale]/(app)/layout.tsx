import { setRequestLocale } from "next-intl/server";
import { DemoApp } from "@/components/app/demo-app";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DemoApp>{children}</DemoApp>;
}
