// Price helpers for the cut cards. Pure functions (no React, no data imports beyond types), so the
// e2e file checks can test them directly.

import type { PriceOption, PriceStatus, PriceUnit } from "@/lib/data/cut-prices";

/** What a cut card shows: the first option, ready to render, and how many other options exist. */
export type CutPriceView = {
  /** Formatted amount, e.g. "$12" or "$6.50". */
  amount: string;
  unit: PriceUnit;
  /** Grams for the unit label: the approximate piece weight, or the pack size. */
  size?: number;
  /** Number of other options ("+N more"). */
  more: number;
};

/** The amount in its own currency, e.g. "$12" (en), "12$" (km); cents only when there are any. */
export function formatPriceAmount(option: Pick<PriceOption, "amount" | "currency">, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: option.currency,
    trailingZeroDisplay: "stripIfInteger",
  }).format(option.amount);
}

/** Every price string on the Beef Cuts page (keys under `beefCuts.grid.price.`). */
const PRICE_STRING_KEYS = [
  "label",
  "units.kg",
  "units.piece",
  "units.pack",
  "more",
  "moreAria",
  "sampleTag",
  "sampleNote",
  "businessLink",
] as const;

/**
 * THE one switch for how amounts are formatted ("$12" in en, "12$" in km). The page locale is used
 * only when EVERY price string is translated (none fell back to English); otherwise "en". So the
 * amount and the words around it (units, labels) can never be in different languages: translate
 * all price strings in km.json and the format switches automatically.
 */
export function priceNumberLocale(pageLocale: string, lang: (key: string) => "en" | undefined): string {
  return PRICE_STRING_KEYS.every((key) => lang(`beefCuts.grid.price.${key}`) === undefined) ? pageLocale : "en";
}

/** Sample prices carry the "Sample prices, for illustration only" note; verified prices do not. */
export function showsSampleLabel(status: PriceStatus): boolean {
  return status === "sample";
}

/** The grams shown in the unit label, if the unit has one. */
export function unitSize(option: PriceOption): number | undefined {
  return option.unit === "piece" ? option.pieceWeight : option.unit === "pack" ? option.packSize : undefined;
}

/** The card's view of a cut's options, or undefined when the cut has no price. */
export function toCutPriceView(options: PriceOption[] | undefined, locale: string): CutPriceView | undefined {
  if (!options?.length) return undefined;
  const first = options[0];
  return { amount: formatPriceAmount(first, locale), unit: first.unit, size: unitSize(first), more: options.length - 1 };
}
