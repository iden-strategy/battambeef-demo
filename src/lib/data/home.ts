// Home page: images, featured items and what is still unverified. Public-safe data only.
// All wording lives in messages (home.*); this file holds order, image paths and sizes.
//
// CLAUDE.md section 12: the cattle photos are AI-generated illustrations. Never caption them as
// "our farm" or "our cattle", and never name a breed (Brahman is not confirmed).

import type { JourneyStageId } from "@/lib/data/journey";

export type HeroImage = {
  /** The full photo (opaque WebP). */
  photo: string;
  /**
   * The cow cut out of the same photo, trimmed to the cow (2px margin) with transparency around
   * it. `cowBox` is where it sits on the photo, in photo pixels. Trimmed so the cutout is always
   * smaller than the photo: the photo then stays the page's LCP element whichever loads first.
   */
  cow: string;
  cowBox: { x: number; y: number; width: number; height: number };
  width: number;
  height: number;
};

/**
 * Wide images for landscape screens (aspect ratio ≥ 1), tall images for portrait screens.
 * Measured cow positions (percent of the photo), used to place the title and the action pill:
 * - wide: cow left 18.8%–79.7%, top of head 28.3%, hooves 99%
 * - tall: cow left 8.1%–94.4%, top of head 51.3%, hooves 87.6%
 * If a photo is replaced, re-measure, re-trim the cutout (and update cowBox) and re-tune
 * --hero-title-* in globals.css.
 */
export const HERO_IMAGES: { wide: HeroImage; tall: HeroImage } = {
  wide: {
    photo: "/images/hero/hero-wide.webp",
    cow: "/images/hero/hero-wide-cutout.webp",
    cowBox: { x: 542, y: 459, width: 1786, height: 1169 },
    width: 2912,
    height: 1638,
  },
  tall: {
    photo: "/images/hero/hero-tall.webp",
    cow: "/images/hero/hero-tall-cutout.webp",
    cowBox: { x: 127, y: 1489, width: 1427, height: 1067 },
    width: 1638,
    height: 2912,
  },
};

/**
 * Round photos inside the statement line. Crops of the hero photos (illustrations).
 * coldRoom: null until a cold-room photo exists; a crimson circle with a snowflake stands in.
 */
export const STATEMENT_PILLS: { cow: string; field: string; coldRoom: string | null } = {
  cow: "/images/home/pill-cow.webp",
  field: "/images/home/pill-field.webp",
  coldRoom: null,
};

/** Featured cuts carousel, in this order (ids from cuts.ts). */
export const FEATURED_CUT_IDS = ["ribeye", "striploin", "tenderloin", "rump", "topside", "brisket"] as const;

/**
 * Farm to Table preview: four of the five journey stages. Wording comes from
 * farmToTable.journey.stages.* (only the 72-hour step states a process fact).
 */
export const HOME_JOURNEY_STAGE_IDS: JourneyStageId[] = ["raising", "processing", "chilling", "delivery"];

/** For Business teaser points. */
export type BusinessPointId = "consistentCuts" | "customCutting" | "regularSupply";
export const BUSINESS_POINTS: { id: BusinessPointId; verify: string | null }[] = [
  { id: "consistentCuts", verify: "TODO-VERIFY: the cut specification and consistency standard." },
  { id: "customCutting", verify: "TODO-VERIFY: which custom cutting and portioning can be offered." },
  // The copy says "Details being confirmed" until delivery is verified.
  { id: "regularSupply", verify: "TODO-VERIFY: supply volumes, delivery schedule and areas (cold-chain not confirmed)." },
];

// Beef Knowledge teaser: the recipes live in knowledge.ts (FEATURED_RECIPE_IDS).
