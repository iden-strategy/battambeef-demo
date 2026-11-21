import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { Link } from "@/i18n/navigation";
import { getCutPricingStatus } from "@/lib/data";
import { showsSampleLabel } from "@/lib/prices";

/**
 * Once per page, above the cut cards: "Sample prices, for illustration only" while the price file
 * is a sample (cut-prices.ts, TODO-VERIFY), and always the way to business (B2B) pricing.
 */
export async function CutPriceNote() {
  const t = await getTranslations("beefCuts.grid.price");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`beefCuts.grid.price.${key}`);

  return (
    <div data-price-note="" className="mb-8 flex flex-wrap items-center gap-x-4 md:mb-10">
      {showsSampleLabel(getCutPricingStatus()) && (
        <p data-sample-note="" className="body-sm text-muted-foreground" lang={k("sampleNote")}>
          {t("sampleNote")}
        </p>
      )}
      <Button asChild variant="link" size="sm">
        <Link href="/business#enquiry" lang={k("businessLink")}>
          {t("businessLink")}
        </Link>
      </Button>
    </div>
  );
}
