import { setRequestLocale } from "next-intl/server";

// STUB: replace with the real page.
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <div className="p-10">clients: coming soon</div>;
}
