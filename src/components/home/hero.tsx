import { getImageProps } from "next/image";
import { getTranslations } from "next-intl/server";
import { HeroEffects } from "@/components/home/hero-effects";
import { HeroSlider, type HeroSlideView } from "@/components/home/hero-slider";
import { SplitTextReveal } from "@/components/motion/split-text-reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { cutMapHref } from "@/lib/cut-links";
import { getHeroSlides, getHeroSteakImageSize } from "@/lib/data";

/**
 * The steak box width (keep in step with --hero-steak-w in globals.css): about 94vw on portrait
 * screens (at most 44rem), half the width on landscape ones.
 */
const STEAK_SIZES = "(min-aspect-ratio: 1/1) 50vw, min(94vw, 704px)";

/**
 * "HOLY COW." depth reveal (CLAUDE.md section 2, moment 1), on a dark stage: the giant title,
 * and a steak floating in front of its lower half, under a warm spotlight glow (CSS only).
 * The steak is a slider (ribeye, striploin, rump: src/lib/data/hero.ts); the first steak is the
 * page's LCP image.
 *
 * Load sequence (all CSS, so it plays without JavaScript): the steak is visible at once and
 * settles from 1.06 to 1; the header and eyebrow fade down; the letters rise one by one; the
 * action pill comes last. Layout and timings: globals.css, "Home hero".
 */
export async function Hero() {
  const t = await getTranslations("home.hero");
  const tk = await getTranslations("kit");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`home.hero.${key}`);
  const size = getHeroSteakImageSize();
  const all = getHeroSlides();

  const slides: HeroSlideView[] = all.map(({ cut, cutId, image }, i) => {
    const first = i === 0;
    const name = t(`steaks.${cutId}.name`);
    // Only the first image loads with the page; the others are mounted after it has settled.
    const { props: img } = getImageProps({
      src: image,
      alt: t(`steaks.${cutId}.alt`),
      width: size.width,
      height: size.height,
      sizes: STEAK_SIZES,
      loading: "eager",
      fetchPriority: first ? "high" : "low",
    });
    return {
      id: cutId,
      img,
      imgLang: k(`steaks.${cutId}.alt`),
      name,
      nameLang: k(`steaks.${cutId}.name`),
      href: cutMapHref(cut),
      // The link's name starts with its visible text, then the visible name: "See this cut: Ribeye Steak".
      linkLabel: t("seeCutAria", { cut: name }),
      linkLang: k("seeCutAria"),
      dotLabel: t("showSlide", { cut: name }),
      dotLang: k("showSlide"),
      groupLabel: tk("slideOf", { current: i + 1, total: all.length }),
    };
  });

  return (
    <HeroEffects data-surface="dark" data-hero="" aria-labelledby="hero-title" className="hero">
      <div className="hero-stage" data-hero-stage="">
        <div className="hero-title-block" data-hero-title-scroll="">
          <div data-depth="title">
            <p className="hero-eyebrow label" lang={k("eyebrow")}>
              {t("eyebrow")}
            </p>
            <SplitTextReveal
              as="h1"
              id="hero-title"
              text={t("title")}
              lang={k("title")}
              accent=".។"
              trigger="mount"
              rise="0.18em"
              stagger={0.085}
              delay={0.35}
              duration={1}
              className="hero-title"
            />
          </div>
        </div>

        <HeroSlider
          slides={slides}
          labels={{
            region: t("sliderLabel"),
            pause: t("pause"),
            pauseLang: k("pause"),
            play: t("play"),
            playLang: k("play"),
            seeCut: t("seeCut"),
            seeCutLang: k("seeCut"),
          }}
        />

        {/* Cream glass: light-surface colours (charcoal text, crimson button). */}
        {/* aria-labelledby (not aria-label) so the name can carry its own language. */}
        <span id="hero-actions-label" hidden lang={k("actionsLabel")}>
          {t("actionsLabel")}
        </span>
        <div role="group" aria-labelledby="hero-actions-label" data-surface="light" className="hero-actions">
          <Button asChild size="sm">
            <Link href="/business/cuts" lang={k("exploreCuts")}>
              {t("exploreCuts")}
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/business" lang={k("forRestaurants")}>
              {t("forRestaurants")}
            </Link>
          </Button>
        </div>

        <p data-illustration-note="" className="hero-note label" lang={k("illustrationNote")}>
          {t("illustrationNote")}
        </p>
      </div>
      <div aria-hidden className="hero-melt" data-hero-melt="" />
    </HeroEffects>
  );
}
