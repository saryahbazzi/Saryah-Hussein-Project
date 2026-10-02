import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/logo";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const brand = useTranslations("meta")("brand");
  return (
    <footer className="bg-navy py-14 text-ivory/80">
      <Container className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo name={brand} invert />
          <p className="mt-4 max-w-sm text-sm">{t("tagline")}</p>
          <p className="mt-2 text-sm">{t("cities")}</p>
        </div>
        <nav aria-label={t("productLabel")}>
          <h2 className="mb-3 text-sm font-semibold text-gold-bright">{t("productLabel")}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/templates" className="hover:text-ivory">{t("templates")}</Link></li>
            <li><Link href="/#pricing" className="hover:text-ivory">{t("pricing")}</Link></li>
            <li><Link href="/#planners" className="hover:text-ivory">{t("planners")}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t("legalLabel")}>
          <h2 className="mb-3 text-sm font-semibold text-gold-bright">{t("legalLabel")}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-ivory">{t("privacy")}</Link></li>
            <li><Link href="/terms" className="hover:text-ivory">{t("terms")}</Link></li>
          </ul>
        </nav>
      </Container>
      <Container className="mt-10 border-t border-ivory/15 pt-6 text-xs">{t("rights")}</Container>
    </footer>
  );
}
