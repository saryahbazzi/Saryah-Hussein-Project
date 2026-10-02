import { useTranslations } from "next-intl";
import { Section, SectionHeading } from "@/components/ui/container";
import { PricingCalculator } from "./pricing-calculator";

export function Pricing() {
  const t = useTranslations("pricing");
  return (
    <Section id="pricing" tone="sand">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} align="center" />
      <div className="mt-12">
        <PricingCalculator />
      </div>
      <p className="mt-6 text-center text-sm text-oud-soft">{t("footnote")}</p>
    </Section>
  );
}
