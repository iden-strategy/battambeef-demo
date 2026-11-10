// Beef Knowledge page: quick links, cooking methods, storage, recipes and FAQ.
// Wording lives in messages (beefKnowledge.*). Recipes reference cuts by id (cuts.ts).
// Storage: general food-safety basics only. Nothing here states shelf life or handling of
// BattamBeef products (TODO-VERIFY).

import type { CookingMethod } from "@/lib/data/cuts";

export type KnowledgeIcon = "map" | "flame" | "snowflake" | "book-open" | "circle-help" | "refrigerator" | "thermometer" | "ban";

export type QuickLinkId = "cutGuide" | "methods" | "storage" | "recipes" | "faq";

/** href: another page, or a section on this page (#id). */
export const QUICK_LINKS: { id: QuickLinkId; href: string; icon: KnowledgeIcon }[] = [
  { id: "cutGuide", href: "/beef-cuts", icon: "map" },
  { id: "methods", href: "#cooking-methods", icon: "flame" },
  { id: "storage", href: "#storage", icon: "snowflake" },
  { id: "recipes", href: "#recipes", icon: "book-open" },
  { id: "faq", href: "#faq", icon: "circle-help" },
];

/** The cooking method selector, in this order. Cuts come from each cut's `methods` in cuts.ts. */
export type GuideMethod = Extract<CookingMethod, "grill" | "pan-sear" | "roast" | "braise" | "stir-fry" | "soup">;
export const GUIDE_METHODS: GuideMethod[] = ["grill", "pan-sear", "roast", "braise", "stir-fry", "soup"];

export type StorageId = "fridge" | "freezer" | "thawing" | "refreezing";

export const STORAGE_CARDS: { id: StorageId; icon: KnowledgeIcon }[] = [
  { id: "fridge", icon: "refrigerator" },
  { id: "freezer", icon: "snowflake" },
  { id: "thawing", icon: "thermometer" },
  { id: "refreezing", icon: "ban" },
];

/** Shown under the storage cards until product-specific guidance is confirmed. */
export const STORAGE_VERIFY = "TODO-VERIFY: storage times and packaging for BattamBeef products.";

export type RecipeId = "lok-lak" | "pan-seared-ribeye" | "brisket-soup" | "pepper-stir-fry";

export type Recipe = {
  id: RecipeId;
  cutId: string;
  method: CookingMethod;
  serves: number;
  minutes: number;
  /** Keys under beefKnowledge.recipes.items.<id>.ingredients / .steps, in order. */
  ingredients: string[];
  steps: string[];
  /** null = placeholder panel until recipe photos exist. */
  image: string | null;
};

export const RECIPES: Recipe[] = [
  {
    id: "lok-lak",
    cutId: "topside",
    method: "lok-lak",
    serves: 2,
    minutes: 40,
    ingredients: ["beef", "garlic", "sauces", "sugar", "salad", "dip", "rice"],
    steps: ["marinate", "salad", "sear", "dip", "serve"],
    image: null,
  },
  {
    id: "pan-seared-ribeye",
    cutId: "ribeye",
    method: "pan-sear",
    serves: 1,
    minutes: 20,
    ingredients: ["steak", "salt", "oil", "butter", "garlic", "herbs"],
    steps: ["temper", "heat", "sear", "baste", "rest"],
    image: null,
  },
  {
    id: "brisket-soup",
    cutId: "brisket",
    method: "soup",
    serves: 4,
    minutes: 200,
    ingredients: ["brisket", "water", "aromatics", "spices", "fishSauce", "vegetables", "herbs"],
    steps: ["blanch", "simmer", "vegetables", "season", "serve"],
    image: null,
  },
  {
    id: "pepper-stir-fry",
    cutId: "flank",
    method: "stir-fry",
    serves: 2,
    minutes: 20,
    ingredients: ["beef", "pepper", "garlic", "onion", "sauces", "sugar", "oil", "spring"],
    steps: ["slice", "season", "sear", "vegetables", "serve"],
    image: null,
  },
];

/** Recipes shown on Home (Beef Knowledge teaser), in this order. */
export const FEATURED_RECIPE_IDS: RecipeId[] = ["lok-lak", "pan-seared-ribeye", "brisket-soup"];

export type FaqId = "origin" | "chilling" | "homeCooks" | "delivery" | "customCuts" | "storage";

/** verify: answers that are placeholders until confirmed (their copy says "Details being confirmed"). */
export const FAQ: { id: FaqId; verify: string | null }[] = [
  { id: "origin", verify: null },
  { id: "chilling", verify: null },
  { id: "homeCooks", verify: "TODO-VERIFY: whether and how home cooks can buy." },
  { id: "delivery", verify: "TODO-VERIFY: delivery areas, schedules and cold-chain (not confirmed)." },
  { id: "customCuts", verify: "TODO-VERIFY: which custom cuts can be offered." },
  { id: "storage", verify: null },
];
