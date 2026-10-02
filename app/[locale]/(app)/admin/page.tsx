import { setRequestLocale } from "next-intl/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AdminDashboard />;
}
