"use client";

import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { forwardRef } from "react";
import { preloadCutDetail } from "@/components/cuts-grid/cut-detail-lazy";
import { CutImage } from "@/components/cuts-grid/cut-image";
import { TiltCard } from "@/components/motion/tilt-card";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { Cut } from "@/lib/data/cuts";
import type { CutPriceView } from "@/lib/prices";

type CutCardProps = {
  cut: Cut;
  /** Retail price (B2C, Beef Cuts cards only), formatted on the server. */
  price?: CutPriceView;
  /** Show the small "Sample" tag in the price block (the prices are still samples). */
  showSampleTag?: boolean;
  /** Small label above the name: the code, else the part(s), else the tier. */
  label: { text: string; lang?: string };
  /** Shared-element id for the image, or undefined when motion is reduced. */
  imageLayoutId?: string;
  onOpen: () => void;
};

/** One cut in the grid. The whole card is a button that opens the detail dialog. */
export const CutCard = forwardRef<HTMLButtonElement, CutCardProps>(function CutCard(
  { cut, price, showSampleTag, label, imageLayoutId, onOpen },
  ref,
) {
  const t = useTranslations("beefCuts.grid");
  const tPrice = useTranslations("beefCuts.grid.price");
  const tm = useTranslations("cutOptions.methods");
  const lang = useFallbackLang();

  return (
    <TiltCard className="h-full rounded-2xl bg-card">
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        onClick={onOpen}
        // Start loading the detail dialog on the first sign of intent.
        onPointerEnter={preloadCutDetail}
        onFocus={preloadCutDetail}
        onPointerDown={preloadCutDetail}
        data-cursor="view"
        className="flex h-full w-full cursor-pointer flex-col text-left"
      >
        <m.span layoutId={imageLayoutId} className="relative block aspect-[4/3] w-full overflow-hidden">
          <CutImage
            cut={cut}
            alt="" /* decorative: the card text next to it names the cut */
            soonLabel={t("photoSoon")}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, (min-width: 480px) 45vw, 92vw"
          />
        </m.span>
        <span className="flex flex-1 flex-col gap-1 p-5">
          <span className="label tabular text-label" lang={label.lang}>
            {label.text}
          </span>
          <span lang="en" className="title-md text-[1.375rem]! leading-tight!">
            {cut.nameEn}
          </span>
          {cut.nameKm && (
            <span lang="km" className="font-khmer text-[1.0625rem] leading-[1.7] text-muted-foreground">
              {cut.nameKm}
            </span>
          )}
          <span className="mt-3 flex flex-wrap gap-1.5">
            {cut.methods.map((method) => (
              <span
                key={method}
                lang={lang(`cutOptions.methods.${method}`)}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tm(method)}
              </span>
            ))}
          </span>
          {price && (
            // Pinned to the bottom of the card, so the prices line up across a grid row.
            <span data-cut-price="" className="mt-auto block pt-5">
              <span className="flex flex-col gap-1 border-t border-border pt-4">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="label text-label" lang={lang("beefCuts.grid.price.label")}>
                    {tPrice("label")}
                  </span>
                  {showSampleTag && (
                    <span
                      data-sample-tag=""
                      className="rounded-full border border-border px-2 py-px text-xs font-medium text-muted-foreground"
                      lang={lang("beefCuts.grid.price.sampleTag")}
                    >
                      {tPrice("sampleTag")}
                    </span>
                  )}
                </span>
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span data-price-amount="" className="tabular font-display text-2xl leading-tight font-extrabold text-foreground">
                    {price.amount}
                  </span>
                  <span data-price-unit="" className="body-sm text-muted-foreground" lang={lang(`beefCuts.grid.price.units.${price.unit}`)}>
                    {tPrice(`units.${price.unit}`, { size: price.size ?? 0 })}
                  </span>
                  {price.more > 0 && (
                    <span data-price-more="" className="body-sm text-muted-foreground">
                      <span data-price-more-visible="" aria-hidden="true" lang={lang("beefCuts.grid.price.more")}>
                        {tPrice("more", { count: price.more })}
                      </span>
                      <span data-price-more-sr="" className="sr-only" lang={lang("beefCuts.grid.price.moreAria")}>
                        {tPrice("moreAria", { count: price.more })}
                      </span>
                    </span>
                  )}
                </span>
              </span>
            </span>
          )}
        </span>
      </button>
    </TiltCard>
  );
});
