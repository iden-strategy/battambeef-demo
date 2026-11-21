// Home page: images, featured items and what is still unverified. Public-safe data only.
// All wording lives in messages (home.*); this file holds order, image paths and sizes.
//
// CLAUDE.md section 12: the cattle photos are AI-generated illustrations. Never caption them as
// "our farm" or "our cattle", and never name a breed (Brahman is not confirmed).

import type { JourneyStageId } from "@/lib/data/journey";

// The hero steak slider has its own file: hero.ts.

/**
 * Round photos inside the statement line (illustrations). cow and field: crops of the hero photo.
 * coldRoom: plain cold-room shelves from the chilling illustration (no labels or logos); set it
 * to null and a crimson circle with a snowflake stands in.
 */
export const STATEMENT_PILLS: { cow: string; field: string; coldRoom: string | null } = {
  cow: "/images/home/pill-cow.webp",
  field: "/images/home/pill-field.webp",
  coldRoom: "/images/home/pill-chilled.webp",
};

/** Featured cuts carousel, in this order (ids from cuts.ts). */
export const FEATURED_CUT_IDS = ["ribeye", "striploin", "tenderloin", "rump", "topside", "short-rib"] as const;

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
