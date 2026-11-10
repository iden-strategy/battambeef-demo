// Farm to Table: the journey from Battambang to the table. Public-safe data only.
// All wording lives in messages (farmToTable.*); this file holds order, images and what is
// still unverified.
//
// CLAUDE.md section 12: only three facts are verified: the Battambang origin, chilling for
// 72 hours after slaughter, and processing with a slaughterhouse partner in Battambang.
// Everything else is TODO-VERIFY and must not be stated as fact.
// Never name the slaughterhouse partner or any supplier here or in messages.

export type JourneyStageId = "raising" | "processing" | "chilling" | "cutting" | "delivery";

export type JourneyStage = {
  id: JourneyStageId;
  /**
   * Stage photo in public/images/journey/, cropped 4:5 (JOURNEY_IMAGE_RATIO).
   * null = no photo yet: a placeholder frame with the stage name is shown. The current photos are
   * AI-generated illustrations: their alt text starts with "Illustration:", the section shows
   * "Images are illustrations.", and they are never captioned as "our farm" or "our cattle".
   */
  image: string | null;
  /** Shows the small "Details being confirmed" note next to the stage text. */
  pendingNote: boolean;
  /** Internal: what still has to be confirmed before the copy can say more. Never displayed. */
  verify: string | null;
};

/** Every stage image uses this crop, so swapping placeholders for photos never shifts the layout. */
export const JOURNEY_IMAGE_RATIO = { width: 4, height: 5 } as const;

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "raising",
    image: "/images/journey/journey-raising.webp",
    pendingNote: false,
    // The copy only says "cattle raised in Battambang province" (origin is verified).
    verify: "TODO-VERIFY: breed (Brahman not confirmed), feed, care and health checks.",
  },
  {
    id: "processing",
    image: "/images/journey/journey-slaughter.webp",
    pendingNote: true,
    // "A slaughterhouse partner in Battambang" is confirmed. Never name the partner.
    verify: "TODO-VERIFY: stunning method, veterinary inspection, hygiene standards.",
  },
  {
    id: "chilling",
    image: "/images/journey/journey-chilling.webp",
    pendingNote: false,
    verify: null, // Verified: carcasses are chilled for 72 hours after slaughter.
  },
  {
    id: "cutting",
    image: "/images/journey/journey-cutting.webp",
    pendingNote: true,
    // The copy only says "Next, the beef is cut and packed." Vacuum packing is NOT confirmed.
    verify: "TODO-VERIFY: cutting into the 11 cut-map parts, packaging (vacuum-packed not confirmed), labelling.",
  },
  {
    id: "delivery",
    image: "/images/journey/journey-delivery.webp",
    pendingNote: true,
    // The copy only says deliveries are being prepared; nothing about how or where yet.
    verify: "TODO-VERIFY: cold-chain delivery, delivery areas and timing.",
  },
];

/** Verified: hours of chilling after slaughter. */
export const CHILL_HOURS = 72;

/** "Why chilling matters": general beef knowledge, not claims about our process. */
export type ChillPointId = "foodSafety" | "tenderness" | "ourBeef";
export const CHILL_POINTS: ChillPointId[] = ["foodSafety", "tenderness", "ourBeef"];

/** "The result" tiles. Icons are chosen in the component. */
export type JourneyResultId = "consistentCuts" | "freshFlavour" | "restaurants" | "homeKitchens";
export const JOURNEY_RESULTS: JourneyResultId[] = ["consistentCuts", "freshFlavour", "restaurants", "homeKitchens"];
