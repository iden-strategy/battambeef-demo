import { ArrowDown, Beef, ChefHat, House, Sparkles, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ChillDial } from "@/components/farm-to-table/chill-dial";
import { Journey } from "@/components/farm-to-table/journey";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { SplitTextReveal } from "@/components/motion/split-text-reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { pageMetadata } from "@/lib/metadata";
import { getChillHours, getChillPoints, getJourneyResults, type JourneyResultId } from "@/lib/data";

export const generateMetadata = () => pageMetadata("farmToTable");

const RESULT_ICONS: Record<JourneyResultId, LucideIcon> = {
  consistentCuts: Beef,
  freshFlavour: Sparkles,
  restaurants: ChefHat,
  homeKitchens: House,
};

export default async function Page() {
  const t = await getTranslations("farmToTable");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`farmToTable.${key}`);
  const hours = getChillHours();

  return (
    <>
      {/* 1. Intro (dark). Above the fold: reveals with CSS, visible without JavaScript. */}
      <section
        data-surface="dark"
        className="flex min-h-[88svh] flex-col justify-end pt-[calc(var(--header-h)+env(safe-area-inset-top)+3rem)] pb-10 md:pb-14"
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
            className="display-xl mt-5 max-w-[13ch] text-balance"
          />
          <Reveal trigger="mount" delay={0.35}>
            <p className="body-lg mt-6 max-w-2xl text-muted-foreground" lang={k("intro.body")}>
              {t("intro.body")}
            </p>
          </Reveal>
          <Reveal trigger="mount" delay={0.5}>
            <a href="#journey" className="group mt-10 inline-flex min-h-11 items-center gap-3 md:mt-14">
              <span className="grid size-11 place-items-center rounded-full border-[1.5px] border-border transition-colors group-hover:border-foreground">
                <ArrowDown aria-hidden className="scroll-cue size-4" />
              </span>
              <span className="label text-label" lang={k("intro.scrollCue")}>
                {t("intro.scrollCue")}
              </span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* 2. The journey (dark): pinned on desktop, stacked on phones and with reduced motion. */}
      <Journey />

      {/* 3. 72 hours (light: the page's one bright moment). */}
      <section
        id="chill"
        data-surface="light"
        aria-labelledby="chill-heading"
        className="section flex min-h-[100svh] items-center"
      >
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <ChillDial hours={hours} unit={t("chill.unit")} unitLang={k("chill.unit")} />
          <div>
            <p className="label text-label" lang={k("chill.label")}>
              {t("chill.label")}
            </p>
            <SplitTextReveal
              as="h2"
              id="chill-heading"
              text={t("chill.title")}
              lang={k("chill.title")}
              className="title-lg mt-3 max-w-[16ch] text-balance"
            />
            <h3 className="label mt-10 text-muted-foreground md:mt-12" lang={k("chill.pointsTitle")}>
              {t("chill.pointsTitle")}
            </h3>
            <Reveal as="ol" stagger={0.1} className="mt-4 border-b border-border">
              {getChillPoints().map((id, i) => (
                <RevealItem as="li" key={id} className="grid grid-cols-[2.5rem_1fr] gap-x-3 border-t border-border py-5">
                  <span aria-hidden className="label pt-1 text-label">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="title-md [--fs:clamp(1.25rem,1.1rem+0.5vw,1.5rem)]" lang={k(`chill.points.${id}.title`)}>
                      {t(`chill.points.${id}.title`)}
                    </p>
                    <p className="body mt-1.5 text-muted-foreground" lang={k(`chill.points.${id}.body`)}>
                      {t(`chill.points.${id}.body`)}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. The result (dark) */}
      <section data-surface="dark" aria-labelledby="result-heading" className="section">
        <div className="container-page">
          <p className="label text-label" lang={k("result.label")}>
            {t("result.label")}
          </p>
          <SplitTextReveal
            as="h2"
            id="result-heading"
            text={t("result.title")}
            lang={k("result.title")}
            className="title-lg mt-3 max-w-[18ch] text-balance"
          />
          <Reveal as="ul" stagger={0.09} className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-14 lg:grid-cols-4">
            {getJourneyResults().map((id) => {
              const Icon = RESULT_ICONS[id];
              return (
                <RevealItem as="li" key={id} className="flex min-h-40 flex-col justify-between gap-8 rounded-2xl bg-card p-5 sm:p-6 lg:min-h-52">
                  <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="title-md [--fs:clamp(1.125rem,1rem+0.6vw,1.5rem)] text-balance" lang={k(`result.items.${id}`)}>
                    {t(`result.items.${id}`)}
                  </span>
                </RevealItem>
              );
            })}
          </Reveal>
          <Reveal className="mt-10 flex flex-wrap gap-3 md:mt-14">
            <MagneticButton>
              <Button asChild size="lg">
                <Link href="/beef-cuts" lang={k("result.ctaCuts")}>
                  {t("result.ctaCuts")}
                </Link>
              </Button>
            </MagneticButton>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact" lang={k("result.ctaQuote")}>
                {t("result.ctaQuote")}
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </>
  );
}
