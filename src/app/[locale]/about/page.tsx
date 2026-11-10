import { getTranslations } from "next-intl/server";
import { IconBadge } from "@/components/icons";
import { MarqueeBand } from "@/components/marquee-band";
import { ImageReveal } from "@/components/motion/image-reveal";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { PageHero } from "@/components/page-hero";
import { PlaceholderWord } from "@/components/placeholder-word";
import { SectionHeading } from "@/components/section-heading";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { getAboutImages, getAboutValues } from "@/lib/data";
import { pageMetadata } from "@/lib/metadata";

export const generateMetadata = () => pageMetadata("about");

/**
 * About: rooted in Battambang. Surfaces: dark hero and story, kraft mission and vision, light
 * values (the breathing section), then a raised marquee band before the footer.
 * Only verified facts (CLAUDE.md section 12); the landscape is an illustration.
 */
export default async function Page() {
  const t = await getTranslations("about");
  // "Battambang", the big word on the story photo placeholder.
  const tPlace = await getTranslations("home.statement");
  const lang = await getFallbackLang();
  const tx = (key: Parameters<typeof t>[0]) => ({ text: t(key), lang: lang(`about.${key}`) });
  const images = getAboutImages();

  return (
    <>
      {/* 1. Hero band (dark) with the Battambang landscape. Above the fold: the photo loads
          early and drifts with the scroll; the text reveals with CSS. */}
      <PageHero
        label={tx("hero.label")}
        title={tx("hero.title")}
        body={tx("hero.body")}
        titleClassName="max-w-[13ch]"
        after={
          <div className="container-page mt-12 md:mt-16">
            <ParallaxImage
              src={images.hero.src}
              alt={t("hero.imageAlt")}
              preload
              fetchPriority="high"
              sizes="(min-width: 1440px) 1344px, 92vw"
              imageClassName="object-[50%_62%]"
              className="aspect-[4/3] rounded-2xl sm:aspect-[16/9] lg:aspect-[21/9]"
            />
          </div>
        }
      />

      {/* 2. Our story (dark): text and photo side by side from 1024px. */}
      <section data-surface="dark" aria-labelledby="story-heading" className="section">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <div>
            <SectionHeading id="story-heading" label={tx("story.label")} title={tx("story.title")} titleClassName="max-w-[14ch]" />
            <Reveal stagger={0.1} className="mt-8 grid max-w-xl gap-5">
              {(["p1", "p2", "p3"] as const).map((p) => (
                <RevealItem key={p} as="p" className="body-lg text-muted-foreground">
                  <span lang={lang(`about.story.${p}`)}>{t(`story.${p}`)}</span>
                </RevealItem>
              ))}
            </Reveal>
          </div>
          {images.story ? (
            <ImageReveal
              src={images.story}
              alt=""
              sizes="(min-width: 1024px) 45vw, 92vw"
              className="aspect-[4/3] rounded-2xl lg:aspect-[4/5]"
            />
          ) : (
            <ImageReveal className="aspect-[4/3] rounded-2xl lg:aspect-[4/5]">
              <div className="stage-placeholder placeholder-fit absolute inset-0 flex flex-col justify-end gap-3 p-6 md:p-8">
                <PlaceholderWord variant="recipe" text={tPlace("c")} lang={lang("home.statement.c")} className="text-accent-text/80" />
                <span className="body-sm text-muted-foreground" lang={lang("about.story.photoSoon")}>
                  {t("story.photoSoon")}
                </span>
              </div>
            </ImageReveal>
          )}
        </div>
      </section>

      {/* 3. Mission and vision (kraft: this page's one kraft section). */}
      <section data-surface="kraft" aria-labelledby="mission-heading" className="section">
        <div className="container-page">
          <SectionHeading id="mission-heading" label={tx("missionVision.label")} title={tx("missionVision.title")} titleClassName="text-accent-text" />
          <Reveal stagger={0.12} className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2 lg:gap-6">
            {(["mission", "vision"] as const).map((id) => (
              <RevealItem key={id} as="article" className="flex flex-col gap-5 rounded-2xl bg-card p-6 sm:p-8 lg:p-10">
                <h3 className="label" lang={lang(`about.missionVision.${id}.label`)}>
                  {t(`missionVision.${id}.label`)}
                </h3>
                <p className="title-md text-balance [--fs:clamp(1.375rem,1.1rem+1vw,2rem)]" lang={lang(`about.missionVision.${id}.body`)}>
                  {t(`missionVision.${id}.body`)}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 4. Values (light: the breathing section). */}
      <section data-surface="light" aria-labelledby="values-heading" className="section">
        <div className="container-page">
          <SectionHeading id="values-heading" label={tx("values.label")} title={tx("values.title")} />
          <Reveal as="ul" stagger={0.08} className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-3 xl:grid-cols-5">
            {getAboutValues().map(({ id, icon }) => (
              <RevealItem key={id} as="li" className="flex flex-col gap-4 rounded-2xl bg-card p-6">
                <IconBadge name={icon} />
                <h3 className="title-md [--fs:clamp(1.25rem,1.1rem+0.5vw,1.5rem)]" lang={lang(`about.values.items.${id}.title`)}>
                  {t(`values.items.${id}.title`)}
                </h3>
                <p className="body text-muted-foreground" lang={lang(`about.values.items.${id}.body`)}>
                  {t(`values.items.${id}.body`)}
                </p>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 5. Campaign marquee (raised charcoal), then the footer. */}
      <MarqueeBand raised />
    </>
  );
}
