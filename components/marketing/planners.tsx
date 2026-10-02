import { useTranslations } from "next-intl";
import { Section, SectionHeading } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

const POINTS = ["multi", "team", "clients", "brand"] as const;

export function Planners() {
  const t = useTranslations("planners");
  return (
    <Section id="planners" tone="navy">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} invert />
          <ButtonLink href="/login?role=planner" variant="gold" className="mt-9">
            {t("cta")}
          </ButtonLink>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {POINTS.map((p) => (
            <li key={p} className="rounded-3xl border border-ivory/15 bg-ivory/5 p-6">
              <h3 className="text-lg font-semibold text-gold-bright">{t(`points.${p}.title`)}</h3>
              <p className="mt-2 text-sm text-ivory/80">{t(`points.${p}.body`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
