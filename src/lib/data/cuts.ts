// BattamBeef cuts: public-safe data only.
// Contains names, Khmer names, codes, cow part and cooking uses.
// Codes are standard industry cut codes; Khmer names were checked with the team.
// Deliberately contains no prices, costs or yield figures.
// `toConfirm: true` = English name still being checked with the butcher; show a subtle
// "name to be confirmed" note in the demo, never present as final.

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
  part: CowPartId;
  code: string | null;
  nameEn: string;
  /** null = not verified yet (TODO-KM): show the English name only, never a guess. */
  nameKm: string | null;
  tier: CutTier;
  methods: CookingMethod[];
  toConfirm?: boolean;
  image?: string; // /images/cuts/<id>.jpg once photos exist
};

export const CUTS: Cut[] = [
  { id: "neck", part: "neck", code: "2280", nameEn: "Neck", nameKm: "សាច់កគោ", tier: "slow-cook", methods: ["stew", "braise", "mince"] },

  { id: "chuck", part: "chuck", code: "2261", nameEn: "Chuck", nameKm: "សាច់ស្មាគោ", tier: "slow-cook", methods: ["braise", "stew", "mince"] },
  { id: "blade", part: "chuck", code: "2300", nameEn: "Blade / Clod", nameKm: "សាច់ស្មាប្រចៀវ", tier: "everyday", methods: ["braise", "stew", "mince"] },
  { id: "oyster-blade", part: "chuck", code: null, nameEn: "Oyster blade", nameKm: "សាច់អយស្ទ័រ", tier: "premium", methods: ["grill", "pan-sear"] },

  { id: "ribeye", part: "rib", code: "2243", nameEn: "Ribeye (Cube roll)", nameKm: "សាច់ក្បាលចំឡក", tier: "premium", methods: ["grill", "pan-sear", "roast"] },

  { id: "striploin", part: "loin", code: "2142", nameEn: "Striploin", nameKm: "សាច់ចំឡកក្រៅ", tier: "premium", methods: ["grill", "pan-sear"] },
  { id: "tenderloin", part: "loin", code: "2160", nameEn: "Tenderloin", nameKm: "សាច់ចំឡកក្នុង", tier: "premium", methods: ["pan-sear", "roast"] },

  { id: "rump", part: "rump", code: "2090", nameEn: "Rump", nameKm: "សាច់គុម្ពកន្ទុយ", tier: "everyday", methods: ["grill", "lok-lak", "stir-fry"] },

  { id: "topside", part: "round", code: "2000", nameEn: "Topside", nameKm: "សាច់ប៊ីស្តេក", tier: "everyday", methods: ["lok-lak", "stir-fry", "thin-slice", "roast"] },
  { id: "silverside", part: "round", code: "2030", nameEn: "Silverside / Outside", nameKm: "សាច់ដុំគល់ក្រោយ", tier: "everyday", methods: ["roast", "thin-slice", "braise"], toConfirm: true },
  { id: "knuckle", part: "round", code: "2070", nameEn: "Knuckle", nameKm: "សាច់ដុំភ្លៅមូល", tier: "everyday", methods: ["stir-fry", "lok-lak", "roast"] },
  { id: "eye-round", part: "round", code: "2040", nameEn: "Eye round", nameKm: "សាច់ដុំភ្លៅក្រោយ", tier: "everyday", methods: ["roast", "thin-slice"] },

  { id: "brisket", part: "brisket", code: "2330", nameEn: "Brisket", nameKm: "សាច់ទ្រូងមុខ", tier: "slow-cook", methods: ["smoke", "braise", "soup"] },

  { id: "plate", part: "plate", code: "2346", nameEn: "Plate / Short rib area", nameKm: "សាច់បំដាន់", tier: "slow-cook", methods: ["braise", "grill", "thin-slice"], toConfirm: true },

  { id: "flank", part: "flank", code: "2200", nameEn: "Flank", nameKm: "សាច់បាងពោះ", tier: "everyday", methods: ["stir-fry", "grill", "mince"] },

  { id: "fore-shank", part: "fore-shank", code: "2360", nameEn: "Fore shank", nameKm: "សាច់កំភួនជើងមុខ", tier: "slow-cook", methods: ["soup", "braise"] },

  { id: "hind-shank", part: "hind-shank", code: "2360", nameEn: "Hind shank", nameKm: "សាច់កំភួនជើងក្រោយ", tier: "slow-cook", methods: ["soup", "braise"] },
  { id: "heel-muscle", part: "hind-shank", code: "2364", nameEn: "Heel muscle", nameKm: null /* TODO-KM */, tier: "slow-cook", methods: ["soup", "braise"], toConfirm: true },
];

// TODO-KM: the Khmer name for "heel-muscle" is still to be confirmed with the team. Until then it
// is null in src/ and not displayed.
// Both shanks share code 2360: they use the same standard industry code.
