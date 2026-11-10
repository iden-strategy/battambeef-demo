import { getImageProps } from "next/image";
import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { HeroEffects } from "@/components/home/hero-effects";
import { SplitTextReveal } from "@/components/motion/split-text-reveal";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { getHeroImages, type HeroImage } from "@/lib/data";

/** Landscape screens (aspect ratio ≥ 1) get the wide images. Keep in step with globals.css. */
const LANDSCAPE = "(min-aspect-ratio: 1/1)";
/** Wide stage: max(100vw, 100svh × 16:9), so on screens narrower than 16:9 it is 178vh wide. */
const WIDE_SIZES = "(max-aspect-ratio: 16/9) 178vh, 100vw";
const TALL_SIZES = "100vw";

/** Scales a `sizes` value (e.g. for the cow, which is narrower than the stage). */
const scaleSizes = (sizes: string, f: number) => sizes.replace(/(\d+(?:\.\d+)?)(vh|vw)/g, (_, n, u) => `${Math.ceil(Number(n) * f)}${u}`);

const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(4)}%`;

/**
 * The photo layer: the wide image on landscape screens, the tall one on portrait. It is the LCP
 * element: fetched first, at high priority, never faded in.
 */
function HeroPhoto({ wide, tall, alt }: { wide: HeroImage; tall: HeroImage; alt: string }) {
  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({ alt, src: wide.photo, width: wide.width, height: wide.height, sizes: WIDE_SIZES });
  const { props: img } = getImageProps({
    alt,
    src: tall.photo,
    width: tall.width,
    height: tall.height,
    sizes: TALL_SIZES,
    loading: "eager",
    fetchPriority: "high",
  });

  return (
    <picture>
      <source media={LANDSCAPE} srcSet={wideSrcSet} sizes={WIDE_SIZES} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...img} className="hero-img" />
    </picture>
  );
}

/**
 * The cow layer: the trimmed cutout placed at its box on the photo (percentages of the stage,
 * per orientation), so it lines up with the photo's own cow to the pixel. Same breakpoint as the
 * photo. Decorative: the photo's alt text already describes the scene.
 */
function HeroCow({ wide, tall }: { wide: HeroImage; tall: HeroImage }) {
  const wb = wide.cowBox;
  const tb = tall.cowBox;
  const wideSizes = scaleSizes(WIDE_SIZES, wb.width / wide.width);
  const tallSizes = scaleSizes(TALL_SIZES, tb.width / tall.width);
  const {
    props: { srcSet: wideSrcSet },
  } = getImageProps({ alt: "", src: wide.cow, width: wb.width, height: wb.height, sizes: wideSizes });
  const { props: img } = getImageProps({
    alt: "",
    src: tall.cow,
    width: tb.width,
    height: tb.height,
    sizes: tallSizes,
    loading: "eager",
  });
  const box = {
    "--cow-x": pct(tb.x, tall.width),
    "--cow-y": pct(tb.y, tall.height),
    "--cow-w": pct(tb.width, tall.width),
    "--cow-h": pct(tb.height, tall.height),
    "--cow-x-wide": pct(wb.x, wide.width),
    "--cow-y-wide": pct(wb.y, wide.height),
    "--cow-w-wide": pct(wb.width, wide.width),
    "--cow-h-wide": pct(wb.height, wide.height),
  } as CSSProperties;

  return (
    <picture className="hero-cow" style={box}>
      <source media={LANDSCAPE} srcSet={wideSrcSet} sizes={wideSizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt="" comes from getImageProps */}
      <img {...img} className="hero-img" aria-hidden />
    </picture>
  );
}

/**
 * "HOLY COW." depth reveal (CLAUDE.md section 2, moment 1). A stage with the photo's exact
 * aspect ratio holds three layers of identical size: the photo, the title and the cow cut out of
 * the same photo. The cow sits above the title, so its hump and back cover the lower letters.
 * Sizes are in container units (cqw) of the stage, so the overlap is the same on every screen.
 *
 * Load sequence (all CSS, so it plays without JavaScript): the photo is visible at once and
 * settles from 1.06 to 1; the header and eyebrow fade down; the letters rise one by one; the
 * action pill comes last. Layout and timings: globals.css, "Home hero".
 */
export async function Hero() {
  const t = await getTranslations("home.hero");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`home.hero.${key}`);
  const { wide, tall } = getHeroImages();

  return (
    <HeroEffects data-surface="dark" data-header="photo" data-hero="" aria-labelledby="hero-title" className="hero">
      <div className="hero-stage" data-hero-stage="">
        {/* Each scene layer: pointer depth on the outer box, the load settle on the inner one
            (both full stage size, so photo and cow scale around the same centre). */}
        <div className="hero-layer" data-depth="scene">
          <div className="hero-layer hero-settle">
            <HeroPhoto wide={wide} tall={tall} alt={t("imageAlt")} />
          </div>
        </div>

        <div className="hero-layer" data-hero-title-scroll="">
          <div className="hero-layer" data-depth="title">
            <div className="hero-title-block">
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
        </div>

        <div className="hero-layer" data-depth="scene">
          <div className="hero-layer hero-settle">
            <HeroCow wide={wide} tall={tall} />
          </div>
        </div>

        {/* Cream glass: light-surface colours (charcoal text, crimson button). */}
        {/* aria-labelledby (not aria-label) so the name can carry its own language. */}
        <span id="hero-actions-label" hidden lang={k("actionsLabel")}>
          {t("actionsLabel")}
        </span>
        <div role="group" aria-labelledby="hero-actions-label" data-surface="light" className="hero-actions">
          <Button asChild size="sm">
            <Link href="/beef-cuts" lang={k("exploreCuts")}>
              {t("exploreCuts")}
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost">
            <Link href="/for-business" lang={k("forRestaurants")}>
              {t("forRestaurants")}
            </Link>
          </Button>
        </div>
      </div>
      <div aria-hidden className="hero-melt" data-hero-melt="" />
    </HeroEffects>
  );
}
