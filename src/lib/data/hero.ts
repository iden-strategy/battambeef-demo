// Home hero: the steak slider. Public-safe data only; all wording (short consumer names, alt
// texts, labels) lives in messages (home.hero.*).
//
// CLAUDE.md section 12: the steak images are AI-generated illustrations.
//
// Replacing an image is a pure file replace: keep the file name and the exact pixel size below
// (a transparent WebP, the steak centred with a small transparent margin), then set its status to
// "final". No code change is needed. CONTENT-TODO.md lists the open ones.

/** The cuts the hero shows (ids from cuts.ts; getHeroSlides checks they exist). */
export type HeroSteakCutId = "ribeye" | "striploin" | "rump";

/** "placeholder": the image does not show its cut correctly yet. "final": approved. */
export type HeroImageStatus = "placeholder" | "final";

export type HeroSlide = {
  cutId: HeroSteakCutId;
  image: string;
  status: HeroImageStatus;
};

/** Every slide image has exactly this size, so the slider box never changes. */
export const HERO_STEAK_IMAGE = { width: 2000, height: 823 } as const;

/** In this order. The first slide is the page's LCP image. */
export const HERO_SLIDES: HeroSlide[] = [
  { cutId: "ribeye", image: "/images/hero/steak-ribeye.webp", status: "final" },
  // TODO-VERIFY: placeholder image, it does not show a striploin steak correctly yet.
  { cutId: "striploin", image: "/images/hero/steak-striploin.webp", status: "placeholder" },
  // TODO-VERIFY: placeholder image, it does not show a rump steak correctly yet.
  { cutId: "rump", image: "/images/hero/steak-rump.webp", status: "placeholder" },
];
