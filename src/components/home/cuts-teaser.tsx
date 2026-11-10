import { getTranslations } from "next-intl/server";
import { CutMap } from "@/components/cut-map/cut-map";
import { DragCarousel } from "@/components/motion/drag-carousel";
import { SplitTextReveal } from "@/components/motion/split-text-reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { PlaceholderWord } from "@/components/placeholder-word";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { getFeaturedCuts, type Cut } from "@/lib/data";

/** Section 4: the compact cut map on its deep "stage" band. */
export async function CutMapTeaser() {
  const t = await getTranslations("home.cutMap");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`home.cutMap.${key}`);

  return (
    <section id="cut-map" data-surface="dark" aria-labelledby="cut-map-heading" className="cutmap-stage pt-20 pb-12 md:pt-32 md:pb-16">
      <div className="container-page">
        <div className="mb-10 grid gap-4 md:mb-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="label text-label" lang={k("label")}>
              {t("label")}
            </p>
            <SplitTextReveal
              as="h2"
              id="cut-map-heading"
              text={t("title")}
              lang={k("title")}
              className="title-lg mt-3 max-w-[18ch] text-balance"
            />
            <p className="body-lg mt-4 max-w-xl text-muted-foreground" lang={k("body")}>
              {t("body")}
            </p>
          </div>
          <Button asChild variant="outline" className="justify-self-start">
            <Link href="/beef-cuts" lang={k("link")}>
              {t("link")}
            </Link>
          </Button>
        </div>
        <CutMap compact />
      </div>
    </section>
  );
}

/** Section 5: featured cuts carousel. Continues the cut map band (no edge between them). */
export async function FeaturedCuts() {
  const t = await getTranslations("home.featured");
  const tm = await getTranslations("cutOptions.methods");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`home.featured.${key}`);
  const cuts = getFeaturedCuts();

  return (
    <section data-surface="dark" aria-labelledby="featured-heading" className="pt-8 pb-20 md:pt-12 md:pb-28">
      <div className="container-page">
        <p className="label text-label" lang={k("label")}>
          {t("label")}
        </p>
        <SplitTextReveal
          as="h2"
          id="featured-heading"
          text={t("title")}
          lang={k("title")}
          className="title-lg mt-3 max-w-[18ch] text-balance"
        />
      </div>
      <DragCarousel label={t("carouselLabel")} className="mt-8 md:mt-10">
        {cuts.map((cut) => (
          <FeaturedCutCard
            key={cut.id}
            cut={cut}
            code={cut.code ? t("code", { code: cut.code }) : t("noCode")}
            codeLang={k(cut.code ? "code" : "noCode")}
            methodsLabel={t("methods")}
            methodsLang={k("methods")}
            methods={cut.methods.map((m) => ({ id: m, label: tm(m), lang: lang(`cutOptions.methods.${m}`) }))}
            viewLabel={t("view", { cut: cut.nameEn })}
            viewLang={k("view")}
          />
        ))}
      </DragCarousel>
    </section>
  );
}

type FeaturedCutCardProps = {
  cut: Cut;
  code: string;
  codeLang?: string;
  methodsLabel: string;
  methodsLang?: string;
  methods: { id: string; label: string; lang?: string }[];
  viewLabel: string;
  viewLang?: string;
};

/**
 * Photo placeholder (raised charcoal with the cut name in big type) until cut photos exist.
 * The whole card links to its part on the Beef Cuts cut map.
 */
function FeaturedCutCard({ cut, code, codeLang, methodsLabel, methodsLang, methods, viewLabel, viewLang }: FeaturedCutCardProps) {
  return (
    <TiltCard className="h-full rounded-2xl bg-card">
      <article className="flex h-full flex-col">
        <div aria-hidden className="stage-placeholder placeholder-fit relative flex aspect-[4/3] items-end overflow-hidden p-5 sm:p-6">
          <PlaceholderWord variant="card" lang="en" text={cut.nameEn.replace(/\s*\(.*\)$/, "")} className="text-balance text-foreground/90" />
        </div>
        <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
          <div>
            <p className="label tabular text-label" lang={codeLang}>
              {code}
            </p>
            <h3 className="title-md mt-2 [--fs:clamp(1.25rem,1.1rem+0.6vw,1.625rem)]">
              <Link
                href={`/beef-cuts#${cut.part}`}
                aria-label={viewLabel}
                lang={viewLang}
                className="after:absolute after:inset-0 after:z-20 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-[-2px] focus-visible:after:outline-ring"
              >
                {cut.nameEn}
              </Link>
            </h3>
            {cut.nameKm && (
              <p lang="km" className="body mt-1 text-muted-foreground">
                {cut.nameKm}
              </p>
            )}
          </div>
          <div className="mt-auto">
            <p className="sr-only" lang={methodsLang}>
              {methodsLabel}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {methods.map((m) => (
                <li key={m.id} lang={m.lang} className="body-sm rounded-full border border-border px-3 py-1">
                  {m.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>
    </TiltCard>
  );
}
