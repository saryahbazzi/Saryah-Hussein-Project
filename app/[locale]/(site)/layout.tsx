import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";

/** Public marketing pages share the landing header and footer. */
export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
