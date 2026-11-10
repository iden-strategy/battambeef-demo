import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CountUp } from "@/components/motion/count-up";
import { ImageReveal } from "@/components/motion/image-reveal";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { SplitTextReveal } from "@/components/motion/split-text-reveal";
import { PlaceholderWord } from "@/components/placeholder-word";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { getBusinessPoints, getChillHours, getCutById, getFeaturedRecipes, getHomeJourneyStages } from "@/lib/data";

function TextLink({ href, children, lang }: { href: string; children: string; lang?: string }) {
  return (
    <Button asChild variant="link" className="body h-11 gap-2">
      <Link href={href} lang={lang}>
        {children}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </Button>
  );
}

/**
 * Section 6: Farm to Table preview (dark). Four of the journey stages with the Farm to Table
 * page's own wording; only the 72-hour step states a process fact.
 */
export async function FarmPreview() {
  const t = await getTranslations("home.farm");
  const tj = await getTranslations("farmToTable.journey");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`home.farm.${key}`);
  const kj = (key: string) => lang(`farmToTable.journey.${key}`);
  const stages = getHomeJourneyStages();
  const hours = getChillHours();

  return (
    <section data-surface="dark" aria-labelledby="farm-heading" className="section">
      <div className="container-page">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="label text-label" lang={k("label")}>
              {t("label")}
            </p>
            <SplitTextReveal
              as="h2"
              id="farm-heading"
              text={t("title")}
              lang={k("title")}
              className="title-lg mt-3 max-w-[16ch] text-balance"
            />
          </div>
          <TextLink href="/farm-to-table" lang={k("link")}>
            {t("link")}
          </TextLink>
        </div>

        <ol className="mt-10 grid gap-x-4 gap-y-10 sm:grid-cols-2 md:mt-14 lg:grid-cols-4 lg:gap-x-6">
          {stages.map((stage, i) => {
            const name = tj(`stages.${stage.id}.short`);
            return (
              <li key={stage.id}>
                {stage.image ? (
                  <ImageReveal delay={i * 0.08} className="aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-[4/5]">
                    <Image
                      src={stage.image}
                      alt={tj(`stages.${stage.id}.imageAlt`)}
                      lang={kj(`stages.${stage.id}.imageAlt`)}
                      fill
                      sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 92vw"
                      className="object-cover"
                    />
                    {/* The chilling step keeps its "72 hours" count, on a charcoal fade for contrast. */}
                    {stage.id === "chilling" && (
                      <p className="absolute inset-x-0 bottom-0 flex items-baseline gap-2 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/75 to-transparent p-5 pt-16">
                        <CountUp
                          to={hours}
                          className="font-display text-[clamp(3.5rem,2.5rem+4vw,6rem)] leading-[0.85] font-black tracking-[-0.04em] text-accent-text"
                        />
                        <span className="label text-foreground" lang={k("hours")}>
                          {t("hours")}
                        </span>
                      </p>
                    )}
                  </ImageReveal>
                ) : (
                  <ImageReveal delay={i * 0.08} className="aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-[4/5]">
                    <div className="stage-placeholder absolute inset-0 flex flex-col justify-between p-5">
                      <span className="label tabular text-label" lang={k("stepOf")}>
                        {t("stepOf", { n: i + 1, total: stages.length })}
                      </span>
                      {stage.id === "chilling" ? (
                        <p className="flex items-baseline gap-2">
                          <CountUp
                            to={hours}
                            className="font-display text-[clamp(4.5rem,3rem+5vw,7.5rem)] leading-[0.85] font-black tracking-[-0.04em] text-accent-text"
                          />
                          <span className="label text-foreground" lang={k("hours")}>
                            {t("hours")}
                          </span>
                        </p>
                      ) : (
                        <span aria-hidden className="title-md text-foreground/85" lang={kj(`stages.${stage.id}.short`)}>
                          {name}
                        </span>
                      )}
                      <span className="body-sm text-muted-foreground" lang={kj("photoSoon")}>
                        {tj("photoSoon")}
                      </span>
                    </div>
                  </ImageReveal>
                )}
                <h3 className="title-md mt-5 [--fs:clamp(1.25rem,1.1rem+0.5vw,1.5rem)]" lang={kj(`stages.${stage.id}.title`)}>
                  {tj(`stages.${stage.id}.title`)}
                </h3>
                <p className="body mt-2 text-muted-foreground" lang={kj(`stages.${stage.id}.body`)}>
                  {tj(`stages.${stage.id}.body`)}
                </p>
                {stage.pendingNote && (
                  <p className="label mt-3 text-muted-foreground" lang={kj("pendingNote")}>
                    {tj("pendingNote")}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        {stages.some((s) => s.image) && (
          <p data-illustration-note="" className="label mt-10 text-muted-foreground" lang={kj("illustrationNote")}>
            {tj("illustrationNote")}
          </p>
        )}
      </div>
    </section>
  );
}

/** Section 7: For Business teaser (light: the page's one breathing section). */
export async function BusinessTeaser() {
  const t = await getTranslations("home.business");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`home.business.${key}`);

  return (
    <section data-surface="light" aria-labelledby="business-heading" className="section">
      <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="label text-label" lang={k("label")}>
            {t("label")}
          </p>
          <SplitTextReveal
            as="h2"
            id="business-heading"
            text={t("title")}
            lang={k("title")}
            className="title-lg mt-3 max-w-[16ch] text-balance"
          />
          <p className="body-lg mt-5 max-w-xl text-muted-foreground" lang={k("body")}>
            {t("body")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-10">
            <MagneticButton>
              <Button asChild size="lg">
                <Link href="/contact" lang={k("cta")}>
                  {t("cta")}
                </Link>
              </Button>
            </MagneticButton>
            <TextLink href="/for-business" lang={k("link")}>
              {t("link")}
            </TextLink>
          </div>
        </div>
        <Reveal as="ol" stagger={0.1} className="self-end border-b border-border">
          {getBusinessPoints().map((id, i) => (
            <RevealItem as="li" key={id} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-border py-6">
              <span aria-hidden className="label tabular pt-1 text-label">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="title-md [--fs:clamp(1.25rem,1.1rem+0.5vw,1.5rem)]" lang={k(`points.${id}.title`)}>
                  {t(`points.${id}.title`)}
                </h3>
                <p className="body mt-1.5 text-muted-foreground" lang={k(`points.${id}.body`)}>
                  {t(`points.${id}.body`)}
                </p>
              </div>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/** Section 8: Beef Knowledge teaser (kraft). Recipe photos are placeholders for now. */
export async function KnowledgeTeaser() {
  const t = await getTranslations("home.knowledge");
  const tr = await getTranslations("beefKnowledge.recipes");
  const tm = await getTranslations("cutOptions.methods");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`home.knowledge.${key}`);
  const recipes = getFeaturedRecipes();

  return (
    <section data-surface="kraft" aria-labelledby="knowledge-heading" className="section">
      <div className="container-page">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="label text-label" lang={k("label")}>
              {t("label")}
            </p>
            {/* Crimson on kraft: large headings only (4.46:1). */}
            <SplitTextReveal
              as="h2"
              id="knowledge-heading"
              text={t("title")}
              lang={k("title")}
              className="title-lg mt-3 max-w-[16ch] text-balance text-accent-text"
            />
            <p className="body-lg mt-4 max-w-xl text-muted-foreground" lang={k("body")}>
              {t("body")}
            </p>
          </div>
          <TextLink href="/beef-knowledge" lang={k("link")}>
            {t("link")}
          </TextLink>
        </div>

        <ul className="mt-10 grid gap-x-4 gap-y-10 md:mt-14 md:grid-cols-3 lg:gap-x-6">
          {recipes.map((recipe) => {
            const cut = getCutById(recipe.cutId);
            const method = tm(recipe.method);
            return (
              <li key={recipe.id} className="relative">
                {recipe.image ? (
                  <ParallaxImage
                    src={recipe.image}
                    alt=""
                    sizes="(min-width: 768px) 30vw, 92vw"
                    className="aspect-[4/3] rounded-2xl md:aspect-[4/5]"
                  />
                ) : (
                  <ParallaxImage className="aspect-[4/3] rounded-2xl md:aspect-[4/5]">
                    {/* Placeholder: a dark panel whose big type drifts like a photo would. */}
                    <div data-surface="dark" className="stage-placeholder placeholder-fit absolute inset-0 flex flex-col items-start justify-center gap-2 p-6">
                      <PlaceholderWord variant="recipe" text={method} lang={lang(`cutOptions.methods.${recipe.method}`)} className="text-accent-text/80" />
                      <span className="body-sm text-muted-foreground" lang={k("photoSoon")}>
                        {t("photoSoon")}
                      </span>
                    </div>
                  </ParallaxImage>
                )}
                <p className="label mt-5 text-label">
                  <span lang="en">{cut?.nameEn}</span> · <span lang={lang(`cutOptions.methods.${recipe.method}`)}>{method}</span>
                </p>
                <h3 className="title-md mt-2 [--fs:clamp(1.25rem,1.1rem+0.5vw,1.5rem)]">
                  <Link
                    href="/beef-knowledge#recipes"
                    lang={lang(`beefKnowledge.recipes.items.${recipe.id}.title`)}
                    className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring [@media(hover:hover)]:hover:underline"
                  >
                    {tr(`items.${recipe.id}.title`)}
                  </Link>
                </h3>
                <p className="body-sm mt-1 text-muted-foreground" lang={lang(`beefKnowledge.recipes.items.${recipe.id}.intro`)}>
                  {tr(`items.${recipe.id}.intro`)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
