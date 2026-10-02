import { useTranslations } from "next-intl";
import { Section, SectionHeading } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { SAMPLE_CARDS } from "@/lib/templates/catalog";

export function Occasions() {
  const t = useTranslations("occasions");
  const c = useTranslations("sampleCard");
  return (
    <Section id="templates">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")} />
        <ButtonLink href="/templates" variant="ghost" className="self-start sm:self-auto">
          {t("browse")}
        </ButtonLink>
      </div>
      <ul className="-mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
        {SAMPLE_CARDS.map((spec, i) => (
          <Reveal as="li" key={spec.slug} delay={i * 80} className="w-56 shrink-0 snap-start lg:w-auto">
            <InvitationCard
              spec={spec}
              content={{
                eyebrow: t(`items.${spec.occasion}`),
                title: c("title"),
                host: c("host"),
                date: c("date"),
                venue: c("venue"),
              }}
            />
            <p className="mt-4 font-semibold text-navy">{t(`items.${spec.occasion}`)}</p>
            <p className="text-sm text-oud-soft">{t(`kinds.${spec.kind}`)}</p>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
