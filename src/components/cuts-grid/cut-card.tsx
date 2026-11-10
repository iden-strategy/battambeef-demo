"use client";

import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { forwardRef } from "react";
import { preloadCutDetail } from "@/components/cuts-grid/cut-detail-lazy";
import { CutImage } from "@/components/cuts-grid/cut-image";
import { TiltCard } from "@/components/motion/tilt-card";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { Cut } from "@/lib/data/cuts";

type CutCardProps = {
  cut: Cut;
  /** Small label above the name: the code, else the part(s), else the tier. */
  label: { text: string; lang?: string };
  /** Shared-element id for the image, or undefined when motion is reduced. */
  imageLayoutId?: string;
  onOpen: () => void;
};

/** One cut in the grid. The whole card is a button that opens the detail dialog. */
export const CutCard = forwardRef<HTMLButtonElement, CutCardProps>(function CutCard(
  { cut, label, imageLayoutId, onOpen },
  ref,
) {
  const t = useTranslations("beefCuts.grid");
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
        </span>
      </button>
    </TiltCard>
  );
});
