import { getTranslations } from "next-intl/server";
import { CutMap } from "@/components/cut-map/cut-map";
import { CutsGrid } from "@/components/cuts-grid/cuts-grid";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { MotionPageProvider } from "@/components/motion/motion-page-provider";
import { Reveal } from "@/components/motion/reveal";
import { SplitTextReveal } from "@/components/motion/split-text-reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCutById } from "@/lib/data";
import { pageMetadata } from "@/lib/metadata";
import { ImageReveal } from "@/components/motion/image-reveal";
import { getFallbackLang } from "@/i18n/get-fallback-lang";

export const generateMetadata = () => pageMetadata("beefCuts");

const SECTION = "section-sm";

export default async function Page() {
  const t = await getTranslations("beefCuts");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`beefCuts.${key}`);
  const soupBones = getCutById("soup-bones");

  return (
    // Many animated elements here (cut map, 20 cards): animation features load with the page.
    <MotionPageProvider>
      {/* 1. Intro (dark). Above the fold: reveals with CSS, visible without JavaScript. */}
      <section
        data-surface="dark"
        className="pt-[calc(var(--header-h)+env(safe-area-inset-top)+3rem)] pb-12 md:pb-16"
      >
        <div className="container-page">
          <Reveal trigger="mount">
            <p className="label text-label" lang={k("intro.label")}>
              {t("intro.label")}
            </p>
          </Reveal>
          <SplitTextReveal
            as="h1"
            text={t("intro.title")}
            lang={k("intro.title")}
            trigger="mount"
            delay={0.1}
            className="display-xl mt-5 max-w-[14ch] text-balance"
          />
          <Reveal trigger="mount" delay={0.35}>
            <p className="body-lg mt-6 max-w-2xl text-muted-foreground" lang={k("intro.body")}>
              {t("intro.body")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. Cut map band (dark). The hash (#loin) preselects a part. */}
      <section id="cut-map" data-surface="dark" className="cutmap-stage pt-10 pb-20 md:pt-14 md:pb-28" aria-labelledby="cut-map-heading">
        <h2 id="cut-map-heading" className="sr-only" lang={k("mapHeading")}>
          {t("mapHeading")}
        </h2>
        <div className="container-page">
          <CutMap preload />
        </div>
      </section>

      {/* 3. All cuts (dark). Below the fold from here on: each section is laid out only as it
          comes near the screen (.defer-render, globals.css). Placeholder heights are the measured
          heights per breakpoint with 20 cuts (1 column ~8700–9100px, 2 ~4250–5000, 3 ~3600, 4 ~2650–2750). */}
      <section
        id="all-cuts"
        data-surface="dark"
        className={`${SECTION} defer-render border-t border-border [--defer-h:8800px] xs:[--defer-h:4250px] md:[--defer-h:5000px] lg:[--defer-h:3600px] xl:[--defer-h:2700px]`}
        aria-labelledby="all-cuts-heading"
      >
        <div className="container-page">
          <p className="label text-label" lang={k("grid.label")}>
            {t("grid.label")}
          </p>
          <SplitTextReveal
            as="h2"
            id="all-cuts-heading"
            tabIndex={-1}
            text={t("grid.title")}
            lang={k("grid.title")}
            className="title-lg mt-3 mb-8 max-w-[18ch] text-balance focus:outline-none md:mb-10"
          />
          <CutsGrid />
        </div>
      </section>

      {/* 4. By-products teaser (kraft: this page's one kraft section) */}
      <section data-surface="kraft" className={`${SECTION} defer-render [--defer-h:640px] md:[--defer-h:620px]`}>
        <div className="container-page grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-12 lg:gap-20">
          <div>
            <p className="label" lang={k("byProducts.label")}>
              {t("byProducts.label")}
            </p>
            <SplitTextReveal
              as="h2"
              text={t("byProducts.title")}
              lang={k("byProducts.title")}
              className="title-lg mt-3 max-w-[20ch] text-balance"
            />
            <Reveal className="mt-5">
              <p className="body-lg max-w-xl text-muted-foreground" lang={k("byProducts.line")}>
                {t("byProducts.line")}
              </p>
              <Button asChild variant="link" className="mt-4 px-0">
                <Link href="/contact" lang={k("byProducts.cta")}>
                  {t("byProducts.cta")}
                </Link>
              </Button>
            </Reveal>
          </div>
          {soupBones?.image && (
            <ImageReveal
              src={soupBones.image}
              alt={t("detail.photoAlt.soup-bones")}
              lang={k("detail.photoAlt.soup-bones")}
              sizes="(min-width: 1440px) 560px, (min-width: 768px) 40vw, 92vw"
              className="aspect-[4/3] rounded-2xl"
            />
          )}
        </div>
      </section>

      {/* 5. Quote CTA (light: the page's breathing section) */}
      <section data-surface="light" className="section defer-render [--defer-h:420px] md:[--defer-h:510px] lg:[--defer-h:550px] xl:[--defer-h:600px]">
        {/* The magnetic button moves up to 8px: well inside this section's padding (no clipping). */}
        <div className="container-page text-center">
          <SplitTextReveal
            as="h2"
            text={t("quote.title")}
            lang={k("quote.title")}
            className="display-xl mx-auto max-w-[14ch] text-balance"
          />
          <Reveal className="mt-6">
            <p className="body-lg mx-auto max-w-xl text-muted-foreground" lang={k("quote.line")}>
              {t("quote.line")}
            </p>
            <div className="mt-8 flex justify-center">
              <MagneticButton>
                <Button asChild size="lg">
                  <Link href="/contact" lang={k("quote.cta")}>
                    {t("quote.cta")}
                  </Link>
                </Button>
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </MotionPageProvider>
  );
}
