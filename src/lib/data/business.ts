// For Business page: offers, steps, reasons and the enquiry form's choices.
// Wording lives in messages (forBusiness.*, forms.*). CLAUDE.md section 12: only the 72-hour
// chilling point is stated as fact here; everything else is neutral or marked TODO-VERIFY, and
// its copy carries "Details being confirmed".

export type BusinessIcon = "warehouse" | "scissors" | "handshake";

export type OfferId = "wholesale" | "customCuts" | "partnerships";

export const OFFERS: { id: OfferId; icon: BusinessIcon; verify: string | null }[] = [
  { id: "wholesale", icon: "warehouse", verify: "TODO-VERIFY: wholesale volumes, minimum orders and schedules." },
  { id: "customCuts", icon: "scissors", verify: "TODO-VERIFY: which custom cuts and portioning can be offered." },
  { id: "partnerships", icon: "handshake", verify: "TODO-VERIFY: what a restaurant partnership includes." },
];

export type StepId = "enquiry" | "discuss" | "samples" | "supply";

export const STEPS: { id: StepId; verify: string | null }[] = [
  { id: "enquiry", verify: null },
  { id: "discuss", verify: null },
  { id: "samples", verify: "TODO-VERIFY: whether samples are offered, and how quotations are prepared." },
  { id: "supply", verify: "TODO-VERIFY: supply schedule, delivery areas and cold-chain (not confirmed)." },
];

export type WhyId = "chilled" | "consistentCuts" | "yourMenu" | "directLine";

/** `fact: true` only for verified claims (CLAUDE.md section 12). */
export const WHY_POINTS: { id: WhyId; fact: boolean; verify: string | null }[] = [
  { id: "chilled", fact: true, verify: null },
  { id: "consistentCuts", fact: false, verify: "TODO-VERIFY: the cut specification and consistency standard." },
  { id: "yourMenu", fact: false, verify: null },
  { id: "directLine", fact: false, verify: "TODO-VERIFY: who handles business orders and how they are contacted." },
];

export const BUSINESS_TYPES = ["restaurant", "hotel", "cafe", "catering", "retail", "other"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

/** Broad ranges only: these are a conversation starter, not a promise of capacity. */
export const WEEKLY_VOLUMES = ["under20", "20to50", "50to100", "over100", "unsure"] as const;
export type WeeklyVolume = (typeof WEEKLY_VOLUMES)[number];
