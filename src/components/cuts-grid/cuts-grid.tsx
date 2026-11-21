import { getLocale } from "next-intl/server";
import { CutsGridClient } from "@/components/cuts-grid/cuts-grid-client";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { getCookingMethods, getCowMap, getCutPrices, getCutPricingStatus, getCuts, getCutTiers } from "@/lib/data";
import { priceNumberLocale, showsSampleLabel, toCutPriceView, type CutPriceView } from "@/lib/prices";

/** Filters + grid + detail dialog for every cut. Server component: data comes through the getters. */
export async function CutsGrid() {
  const cuts = getCuts();
  // Prices are formatted here, on the server (the browser's number formatting can differ from
  // Node's, which would break hydration). One switch (priceNumberLocale) decides the number format
  // from all the price strings together, so amount and words always agree.
  const lang = await getFallbackLang();
  const priceLocale = priceNumberLocale(await getLocale(), lang);
  const showSampleTag = showsSampleLabel(getCutPricingStatus());
  const prices: Record<string, CutPriceView> = {};
  for (const cut of cuts) {
    const view = toCutPriceView(getCutPrices(cut.id), priceLocale);
    if (view) prices[cut.id] = view;
  }

  return (
    <CutsGridClient
      cuts={cuts}
      prices={prices}
      showSampleTag={showSampleTag}
      parts={getCowMap().parts}
      methods={getCookingMethods()}
      tiers={getCutTiers()}
    />
  );
}
