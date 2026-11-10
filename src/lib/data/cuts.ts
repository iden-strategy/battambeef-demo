// BattamBeef cuts: public-safe data only.
// Contains names, Khmer names, codes, cow parts and cooking uses.
// The list, English names and Khmer names were confirmed by the team; codes are standard industry
// cut codes. Deliberately contains no prices, costs or yield figures.
// Order: front to back along the cow (as on the cut map), cuts that are not on the map last.

import type { CowPartId } from "@/lib/data/cow-map";

export type CookingMethod =
  | "grill" | "pan-sear" | "roast" | "braise" | "stew" | "stir-fry"
  | "lok-lak" | "soup" | "mince" | "smoke" | "thin-slice";

export const COOKING_METHODS: CookingMethod[] = [
  "grill", "pan-sear", "roast", "braise", "stew", "stir-fry",
  "lok-lak", "soup", "mince", "smoke", "thin-slice",
];

export type CutTier = "premium" | "everyday" | "slow-cook";

export const CUT_TIERS: CutTier[] = ["premium", "everyday", "slow-cook"];

export type Cut = {
  id: string;
  /**
   * Where the cut sits on the cut map: usually one part, two for a cut taken from both (shin),
   * none for cuts that are not one place on the cow (trimmings, bones). A cut with no part is in
   * the grid but not on the map, and has no "Show on the cow".
   */
  parts: CowPartId[];
  code: string | null;
  nameEn: string;
  /** null = no checked Khmer name (TODO-KM): show the English name only, never a guess. */
  nameKm: string | null;
  tier: CutTier;
  methods: CookingMethod[];
  image?: string; // /images/cuts/<id>.webp once a photo exists
};

export const CUTS: Cut[] = [
  { id: "neck-chuck", parts: ["neck"], code: "2280", nameEn: "Neck / chuck", nameKm: "សាច់កគោ", tier: "slow-cook", methods: ["stew", "braise", "mince"], image: "/images/cuts/neck-chuck.webp" },

  { id: "blade", parts: ["chuck"], code: "2300", nameEn: "Blade", nameKm: "សាច់ស្មាប្រចៀវ", tier: "everyday", methods: ["braise", "stew", "mince"], image: "/images/cuts/blade.webp" },
  { id: "shoulder-clod", parts: ["chuck"], code: "2261", nameEn: "Shoulder clod", nameKm: "សាច់ស្មាគោ", tier: "everyday", methods: ["braise", "stew", "roast"], image: "/images/cuts/shoulder-clod.webp" },
  { id: "oyster-blade", parts: ["chuck"], code: null, nameEn: "Oyster blade", nameKm: "សាច់អយស្ទ័រ", tier: "premium", methods: ["grill", "pan-sear"], image: "/images/cuts/oyster-blade.webp" },

  { id: "ribeye", parts: ["rib"], code: "2243", nameEn: "Ribeye (cube roll)", nameKm: "សាច់ក្បាលចំឡក", tier: "premium", methods: ["grill", "pan-sear", "roast"], image: "/images/cuts/ribeye.webp" },
  { id: "short-rib", parts: ["rib"], code: null, nameEn: "Ribs with meat (short rib)", nameKm: "ឆ្អឹងក្បាលចំឡក + ឆ្អឹងជំនី", tier: "slow-cook", methods: ["braise", "grill"], image: "/images/cuts/short-rib.webp" },

  { id: "striploin", parts: ["loin"], code: "2142", nameEn: "Striploin", nameKm: "សាច់ចំឡកក្រៅ", tier: "premium", methods: ["grill", "pan-sear"], image: "/images/cuts/striploin.webp" },
  { id: "tenderloin", parts: ["loin"], code: "2160", nameEn: "Tenderloin", nameKm: "សាច់ចំឡកក្នុង", tier: "premium", methods: ["pan-sear", "roast"], image: "/images/cuts/tenderloin.webp" },

  { id: "rump", parts: ["rump"], code: "2090", nameEn: "Rump", nameKm: "សាច់គុម្ពកន្ទុយ", tier: "everyday", methods: ["grill", "lok-lak", "stir-fry"], image: "/images/cuts/rump.webp" },

  { id: "topside", parts: ["round"], code: "2000", nameEn: "Topside", nameKm: "សាច់ប៊ីស្តេក", tier: "everyday", methods: ["lok-lak", "stir-fry", "thin-slice", "roast"], image: "/images/cuts/topside.webp" },
  { id: "silverside", parts: ["round"], code: "2030", nameEn: "Outside / silverside", nameKm: "សាច់ដុំគល់កក្រោយ", tier: "everyday", methods: ["roast", "thin-slice", "braise"], image: "/images/cuts/silverside.webp" },
  { id: "knuckle", parts: ["round"], code: "2070", nameEn: "Knuckle", nameKm: "សាច់ដុំភ្លៅមុខ", tier: "everyday", methods: ["stir-fry", "lok-lak", "roast"], image: "/images/cuts/knuckle.webp" },
  { id: "eye-round", parts: ["round"], code: "2040", nameEn: "Eye round", nameKm: "សាច់ដុំភ្លៅក្រោយ", tier: "everyday", methods: ["roast", "thin-slice"], image: "/images/cuts/eye-round.webp" },

  { id: "brisket", parts: ["brisket"], code: "2330", nameEn: "Brisket", nameKm: "សាច់ទ្រូងមុខ", tier: "slow-cook", methods: ["smoke", "braise", "soup"], image: "/images/cuts/brisket.webp" },

  { id: "short-plate", parts: ["plate"], code: "2346", nameEn: "Short plate / navel", nameKm: "សាច់បិផន់", tier: "slow-cook", methods: ["braise", "grill", "thin-slice"], image: "/images/cuts/short-plate.webp" },

  { id: "thin-flank", parts: ["flank"], code: "2200", nameEn: "Thin flank (belly)", nameKm: "សាច់បាតពោះ", tier: "everyday", methods: ["stir-fry", "grill", "mince"], image: "/images/cuts/thin-flank.webp" },

  // Both shanks share code 2360 (the same standard industry code).
  { id: "shin", parts: ["fore-shank", "hind-shank"], code: "2360", nameEn: "Shin (fore and hind)", nameKm: "សាច់កំភួនជើងមុខ + ក្រោយ", tier: "slow-cook", methods: ["soup", "braise"], image: "/images/cuts/shin.webp" },
  { id: "heel-muscle", parts: ["hind-shank"], code: "2364", nameEn: "Heel muscle", nameKm: "សាច់ដុំឈើង", tier: "slow-cook", methods: ["soup", "braise"], image: "/images/cuts/heel-muscle.webp" },

  // Not one place on the cow: in the grid, not on the map.
  { id: "trimmings-mince", parts: [], code: null, nameEn: "Trimmings for mince", nameKm: "សាច់យារ", tier: "everyday", methods: ["mince"], image: "/images/cuts/trimmings-mince.webp" },
  { id: "soup-bones", parts: [], code: null, nameEn: "Soup bones (leg, neck, hip)", nameKm: "ឆ្អឹងជើង ឆ្អឹងកគោ ឆ្អឹងត្រគាក", tier: "slow-cook", methods: ["soup"], image: "/images/cuts/soup-bones.webp" },
];
