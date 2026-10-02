import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { IBM_Plex_Sans_Arabic, Cormorant_Garamond, Amiri } from "next/font/google";
import { isRtl, routing } from "@/i18n/routing";
import "../globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-plex",
  display: "swap",
});
const displayLatin = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal"],
  variable: "--font-display-latin",
  display: "swap",
});
const displayAr = Amiri({
  subsets: ["arabic"],
  weight: ["700"],
  variable: "--font-display-ar",
  display: "swap",
});

// Namespaces shipped to the browser (client components). Landing-only copy stays server-side.
const CLIENT_NAMESPACES = [
  "meta", "common", "nav", "app", "pricing", "auth", "occasions", "sampleCard",
  "wizard", "templates", "dashboard", "checkin", "admin", "ticket",
] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(site),
    title: { default: t("title"), template: `%s · ${t("brand")}` },
    description: t("description"),
    alternates: {
      canonical: `/${locale}`,
      languages: { ar: "/ar", en: "/en" },
    },
    openGraph: { title: t("title"), description: t("description"), locale },
  };
}

export const viewport: Viewport = {
  themeColor: "#fbf7ef",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const all = await getMessages();
  // Only ship the namespaces that client components use; the rest stays server-side.
  const messages = Object.fromEntries(CLIENT_NAMESPACES.map((ns) => [ns, all[ns as keyof typeof all]]));

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      className={`${plex.variable} ${displayLatin.variable} ${displayAr.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
