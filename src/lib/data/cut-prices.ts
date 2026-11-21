// TODO-VERIFY: consumer (B2C) retail prices for the cut cards on Beef Cuts (/business/cuts).
// Every figure below is a SAMPLE for the investor demo: round illustration numbers, not market
// prices and not BattamBeef's real prices. While `status` is "sample" the page labels them
// "Sample prices, for illustration only"; set it to "verified" once the team has confirmed every
// price, and the label disappears.
// Rules (CLAUDE.md section 12): retail prices only, shown on the cut cards only, never on the
// business pages. Never put supplier prices, cost prices, quotations or yields here.

export type PriceStatus = "sample" | "verified";

export type PriceUnit = "kg" | "piece" | "pack";

/**
 * One way a cut is sold. `currency` is an ISO 4217 code ("USD" today; "KHR" can be added later
 * without changing any component: the amount is formatted with Intl.NumberFormat).
 */
export type PriceOption = { amount: number; currency: string } & (
  | { unit: "kg" }
  /** `pieceWeight`: the approximate weight of one piece in grams, shown as "per ~300 g piece". */
  | { unit: "piece"; pieceWeight: number }
  /** `packSize`: the pack's weight in grams, shown as "per 500 g pack". */
  | { unit: "pack"; packSize: number }
);

export type CutPricing = {
  status: PriceStatus;
  /** Keyed by cut id (cuts.ts). The first option is the one shown on the card. */
  prices: Record<string, PriceOption[]>;
};

const kg = (amount: number): PriceOption => ({ amount, currency: "USD", unit: "kg" });
const piece = (amount: number, pieceWeight: number): PriceOption => ({ amount, currency: "USD", unit: "piece", pieceWeight });
const pack = (amount: number, packSize: number): PriceOption => ({ amount, currency: "USD", unit: "pack", packSize });

export const CUT_PRICING: CutPricing = {
  status: "sample",
  prices: {
    "neck-chuck": [kg(9), pack(5, 500)],
    blade: [kg(10)],
    "shoulder-clod": [kg(10)],
    "oyster-blade": [piece(6, 250), kg(18)],
    ribeye: [piece(12, 300), kg(28)],
    "short-rib": [kg(14)],
    striploin: [piece(10, 300), kg(24)],
    tenderloin: [piece(14, 250), kg(32)],
    rump: [kg(13)],
    topside: [kg(12), pack(7, 500)],
    silverside: [kg(11)],
    knuckle: [kg(11)],
    "eye-round": [kg(12)],
    brisket: [kg(12)],
    "short-plate": [kg(11), pack(6, 500)],
    "thin-flank": [kg(10)],
    shin: [kg(11)],
    "heel-muscle": [kg(12)],
    "trimmings-mince": [pack(5, 500), kg(9)],
    "soup-bones": [kg(4)],
  },
};
