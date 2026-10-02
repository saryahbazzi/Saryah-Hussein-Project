import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";

interface LegalSection { id: string; title: string; paras: string[]; items: string[] }

/** Date shown as "last updated" on both legal pages. Bump when the text changes. */
export const LEGAL_UPDATED = "2026-10-02";

/** Shared layout for the privacy policy and terms: draft notice, table of contents, readable long-form text. */
export async function LegalDocument({ doc }: { doc: "privacy" | "terms" }) {
  const t = await getTranslations("legal");
  const locale = await getLocale();
  const sections = t.raw(`${doc}.sections`) as LegalSection[];
  const other = doc === "privacy" ? "terms" : "privacy";
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB", { dateStyle: "long", timeZone: "Asia/Riyadh" }).format(new Date(`${LEGAL_UPDATED}T12:00:00Z`));

  const toc = (
    <ol className="space-y-1 text-sm">
      {sections.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="block min-h-9 rounded-lg px-3 py-1.5 text-oud-soft hover:bg-sand hover:text-navy">{s.title}</a>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="bg-ivory">
      <Container className="py-12 sm:py-16">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold text-gold-ink">{t("common.updated", { date })}</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-navy sm:text-5xl">{t(`${doc}.title`)}</h1>
          <p className="mt-4 text-lg text-oud-soft">{t(`${doc}.lead`)}</p>
        </header>

        <aside role="note" className="mt-8 max-w-3xl rounded-3xl border border-gold/50 bg-gold-bright/20 p-5 sm:p-6">
          <p className="font-semibold text-gold-ink">{t("common.draftTitle")}</p>
          <p className="mt-1 text-sm leading-relaxed text-oud">{t("common.draftBody")}</p>
        </aside>

        <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label={t("common.toc")} className="lg:sticky lg:top-6 lg:self-start">
            <details className="rounded-2xl border border-line bg-white/70 p-3 lg:hidden">
              <summary className="min-h-11 cursor-pointer py-2 font-semibold text-navy">{t("common.tocMobile")}</summary>
              <div className="mt-2">{toc}</div>
            </details>
            <div className="hidden lg:block">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-oud-soft">{t("common.toc")}</p>
              {toc}
            </div>
          </nav>

          <article className="max-w-3xl">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-6 border-b border-line py-8 first:pt-0 last:border-0">
                <h2 className="font-display text-2xl font-bold text-navy">{s.title}</h2>
                {s.paras.map((p, i) => <p key={i} className="mt-3 leading-8 text-oud">{p}</p>)}
                {s.items.length > 0 && (
                  <ul className="mt-3 list-disc space-y-2 ps-6 leading-8 text-oud marker:text-gold">
                    {s.items.map((it, i) => <li key={i}>{it}</li>)}
                  </ul>
                )}
              </section>
            ))}
            <p className="mt-8 text-sm text-oud-soft">
              {t("common.otherDoc")}{" "}
              <Link href={`/${other}`} className="font-semibold text-gold-ink underline underline-offset-4">{t(`${other}.title`)}</Link>
            </p>
          </article>
        </div>
      </Container>
    </div>
  );
}
