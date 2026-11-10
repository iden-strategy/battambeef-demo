"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { EASE_OUT_EXPO } from "@/components/motion/tokens";
import { useMotionPrefs } from "@/components/motion/use-motion-prefs";
import { requestPartFilter } from "@/components/cut-map/cut-events";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { CowPartGeometry } from "@/lib/data/cow-map";
import type { Cut } from "@/lib/data/cuts";
import { quoteHref } from "@/lib/quote-link";
import { cn } from "@/lib/utils";

type CutPanelProps = {
  part: CowPartGeometry;
  total: number;
  cuts: Cut[];
  compact?: boolean;
};

export function CutPanel({ part, total, cuts, compact = false }: CutPanelProps) {
  const t = useTranslations("cutMap");
  const lang = useFallbackLang();
  const { reduced } = useMotionPrefs();
  const partName = t(`parts.${part.id}`);
  const shown = compact ? cuts.slice(0, 2) : cuts;

  return (
    <div className={cn("rounded-2xl bg-card", compact ? "p-5" : "p-6 md:p-8")}>
      {/* Screen readers hear the new part when the selection changes (the map itself is hidden from them). */}
      <p role="status" className="sr-only" lang={lang("cutMap.partOf")}>
        {t("partOf", { n: part.number, total })}: {partName}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={part.id}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.25, ease: EASE_OUT_EXPO }}
        >
          <p className="label tabular text-label" lang={lang("cutMap.partOf")}>
            {t("partOf", { n: part.number, total })}
          </p>
          <h3 className="title-md mt-2" lang={lang(`cutMap.parts.${part.id}`)}>
            {partName}
          </h3>
          {!compact && (
            <p className="body mt-3 max-w-prose text-muted-foreground" lang={lang(`cutMap.descriptions.${part.id}`)}>
              {t(`descriptions.${part.id}`)}
            </p>
          )}

          <h4 className="sr-only" lang={lang("cutMap.cutsHeading")}>
            {t("cutsHeading")}
          </h4>
          <ul className={cn("border-border", compact ? "mt-4" : "mt-6", "divide-y divide-border border-y")}>
            {shown.map((cut) => (
              <CutRow key={cut.id} cut={cut} compact={compact} />
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {compact ? (
              <Button asChild variant="link" size="sm" className="px-0">
                <Link href={`/beef-cuts#${part.id}`} lang={lang("cutMap.exploreAll")}>
                  {t("exploreAll")}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link href={quoteHref(part.id)} lang={lang("cutMap.requestQuote")}>
                    {t("requestQuote", { part: partName })}
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => requestPartFilter(part.id)} lang={lang("cutMap.seeAll")}>
                  {t("seeAll", { part: partName })}
                </Button>
              </>
            )}
          </div>
        </m.div>
      </AnimatePresence>
    </div>
  );
}

function CutRow({ cut, compact }: { cut: Cut; compact: boolean }) {
  const tm = useTranslations("cutOptions.methods");
  const lang = useFallbackLang();

  return (
    <li className="py-4">
      <div className="flex items-baseline justify-between gap-4">
        {/* No Khmer name yet (TODO-KM): the English name leads instead of a guess. */}
        {cut.nameKm ? (
          <p lang="km" className="font-khmer text-[1.0625rem] leading-[1.7] font-medium">
            {cut.nameKm}
          </p>
        ) : (
          <p lang="en" className="text-base leading-snug font-semibold">
            {cut.nameEn}
          </p>
        )}
        {cut.code && <p className="label tabular shrink-0 text-label">{cut.code}</p>}
      </div>
      {cut.nameKm && (
        <p lang="en" className="body-sm text-muted-foreground">
          {cut.nameEn}
        </p>
      )}
      {!compact && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {cut.methods.map((m) => (
            <li
              key={m}
              lang={lang(`cutOptions.methods.${m}`)}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            >
              {tm(m)}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
