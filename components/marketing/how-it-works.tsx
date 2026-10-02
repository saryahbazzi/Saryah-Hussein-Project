import { useTranslations } from "next-intl";
import { Section, SectionHeading } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

const STEPS = ["one", "two", "three"] as const;

export function HowItWorks() {
  const t = useTranslations("how");
  return (
    <Section id="how">
      <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal as="li" key={s} delay={i * 120} className="relative rounded-3xl border border-line bg-white/60 p-8 shadow-card">
            <span className="font-display text-6xl font-bold text-gold/60" aria-hidden="true">
              {i + 1}
            </span>
            <h3 className="mt-3 text-xl font-semibold text-navy">{t(`steps.${s}.title`)}</h3>
            <p className="mt-3 text-oud-soft">{t(`steps.${s}.body`)}</p>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
