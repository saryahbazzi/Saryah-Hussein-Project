import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { InvitationCard } from "@/components/invitation/invitation-card";
import { SAMPLE_CARDS } from "@/lib/templates/catalog";

export function Hero() {
  const t = useTranslations("hero");
  const c = useTranslations("sampleCard");
  const content = {
    eyebrow: c("eyebrow"),
    title: c("title"),
    host: c("host"),
    date: c("date"),
    venue: c("venue"),
  };

  return (
    <section className="pattern-star relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-ivory/0 via-ivory/60 to-ivory" aria-hidden="true" />
      <Container className="relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-ivory/80 px-4 py-1.5 text-sm font-medium text-gold-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
            {t("badge")}
          </p>
          <h1 className="font-display text-[2.6rem] font-bold text-navy sm:text-6xl lg:text-[4.25rem]">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-oud-soft sm:text-xl">{t("subtitle")}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/events/new">{t("primary")}</ButtonLink>
            <ButtonLink href="/#templates" variant="ghost">{t("secondary")}</ButtonLink>
          </div>
          <p className="mt-6 text-sm text-oud-soft">{t("trust")}</p>
        </div>

        <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
          <div className="float-slow [--r:-3deg] -rotate-3">
            <InvitationCard spec={SAMPLE_CARDS[0]} content={content} />
          </div>
          <div className="absolute -bottom-8 start-[-10%] w-[78%] rounded-2xl rounded-es-sm bg-white p-4 shadow-lift sm:start-[-18%]">
            <p className="text-xs font-semibold text-sage">{t("bubbleFrom")}</p>
            <p className="mt-1 text-sm leading-relaxed text-oud">{t("bubbleBody")}</p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-white">{t("bubbleYes")}</span>
              <span className="rounded-full border border-oud/20 px-3 py-1 text-xs font-semibold text-oud-soft">{t("bubbleNo")}</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
