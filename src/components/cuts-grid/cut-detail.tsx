"use client";

import * as m from "motion/react-m";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { CutImage } from "@/components/cuts-grid/cut-image";
import { EASE_OUT_EXPO } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { CowPartGeometry } from "@/lib/data/cow-map";
import type { Cut } from "@/lib/data/cuts";
import { cutQuoteHref } from "@/lib/quote-link";

type Text = { text: string; lang?: string };

/** "2360 · Part 10 of 11", "2360 · Parts 10 and 11 of 11", or just the code for a cut not on the map. */
function PartLabel({
  code,
  numbers,
  one,
  many,
  listLocale,
}: {
  code: string | null;
  numbers: number[];
  one: (n: number) => Text;
  many: (list: string) => Text;
  listLocale: string;
}) {
  const part =
    numbers.length === 0
      ? null
      : numbers.length === 1
        ? one(numbers[0])
        : many(new Intl.ListFormat(listLocale, { type: "conjunction" }).format(numbers.map(String)));
  if (!code && !part) return null;
  return (
    <p className="label tabular text-label">
      {code}
      {code && part ? " · " : ""}
      {part && <span lang={part.lang}>{part.text}</span>}
    </p>
  );
}

export type CutDetailProps = {
  cut: Cut;
  /** The cut's parts on the map: none (bones, trimmings), one, or two (shin). */
  parts: CowPartGeometry[];
  /** The part names joined for a sentence ("Fore shank and Hind shank"); "" when there are none. */
  partNames: string;
  totalParts: number;
  tierName: string;
  imageLayoutId?: string;
  reduced: boolean;
  onClose: () => void;
  /** "Show on the cow"; undefined hides the button (cuts that are not on the map). */
  onShowOnCow?: () => void;
  /** Called after the dialog has gone, to put focus back (the card, or the map chip). */
  onClosed: () => void;
};

/**
 * The expanded cut. Radix Dialog gives the focus trap, Escape, scroll lock and screen reader
 * semantics; Motion's layoutId morphs the card photo into the larger photo.
 * Mounted only while open, so the parent's AnimatePresence can play the exit.
 */
export function CutDetail({
  cut,
  parts,
  partNames,
  totalParts,
  tierName,
  imageLayoutId,
  reduced,
  onClose,
  onShowOnCow,
  onClosed,
}: CutDetailProps) {
  const t = useTranslations("beefCuts.detail");
  const tg = useTranslations("beefCuts.grid");
  const tc = useTranslations("cutMap");
  const tm = useTranslations("cutOptions.methods");
  const lang = useFallbackLang();
  const locale = useLocale();
  // Photo description from messages; a cut added later without one falls back to its name.
  const altKey = `photoAlt.${cut.id}` as Parameters<typeof t>[0]; // cut ids are data, checked with t.has
  const hasAlt = t.has(altKey);
  const fade = reduced ? { duration: 0.15, ease: "linear" as const } : { duration: 0.35, ease: EASE_OUT_EXPO };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <m.div
            className="fixed inset-0 z-[80] bg-brand-charcoal/85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
          />
        </Dialog.Overlay>
        <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] sm:p-6 sm:pt-[max(1.5rem,env(safe-area-inset-top))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pl-[max(1.5rem,env(safe-area-inset-left))]">
          <Dialog.Content
            asChild
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              onClosed();
            }}
          >
            <m.div
              data-surface="dark"
              className="pointer-events-auto relative max-h-full w-full max-w-4xl overflow-y-auto overscroll-contain rounded-2xl bg-card shadow-2xl md:grid md:grid-cols-2"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              transition={fade}
            >
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("close")}
                  className="absolute top-3 right-3 z-10 bg-brand-charcoal/70 hover:bg-brand-charcoal"
                >
                  <X />
                </Button>
              </Dialog.Close>

              {/* 4:3 like the card photo, so the card → dialog morph keeps its shape. */}
              <m.div
                layoutId={imageLayoutId}
                lang={hasAlt ? lang(`beefCuts.detail.photoAlt.${cut.id}`) : "en"}
                className="relative aspect-[4/3] w-full overflow-hidden md:self-start"
              >
                <CutImage
                  cut={cut}
                  alt={hasAlt ? t(altKey) : cut.nameEn}
                  soonLabel={tg("photoSoon")}
                  sizes="(min-width: 896px) 448px, (min-width: 768px) 46vw, 92vw"
                />
              </m.div>

              <div className="flex flex-col gap-5 p-6 md:p-8">
                <div>
                  <PartLabel
                    code={cut.code}
                    numbers={parts.map((p) => p.number)}
                    one={(n) => ({ text: tc("partOf", { n, total: totalParts }), lang: lang("cutMap.partOf") })}
                    many={(list) => ({ text: tc("partsOf", { list, total: totalParts }), lang: lang("cutMap.partsOf") })}
                    listLocale={lang("cutMap.partsOf") ?? locale}
                  />
                  <Dialog.Title lang="en" className="title-md mt-2">
                    {cut.nameEn}
                  </Dialog.Title>
                  {cut.nameKm && (
                    <p lang="km" className="font-khmer mt-1 text-[1.0625rem] leading-[1.7]">
                      {cut.nameKm}
                    </p>
                  )}
                </div>

                {parts.length > 0 ? (
                  <Dialog.Description className="body text-muted-foreground" lang={lang("beefCuts.detail.description")}>
                    {t("description", { part: partNames, tier: tierName })}
                  </Dialog.Description>
                ) : (
                  <Dialog.Description className="body text-muted-foreground" lang={lang("beefCuts.detail.descriptionNoPart")}>
                    {t("descriptionNoPart", { tier: tierName })}
                  </Dialog.Description>
                )}

                <div>
                  <p className="label text-label" lang={lang("beefCuts.detail.methods")}>
                    {t("methods")}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {cut.methods.map((method) => (
                      <li
                        key={method}
                        lang={lang(`cutOptions.methods.${method}`)}
                        className="rounded-full border border-border px-3 py-1 text-sm font-medium text-muted-foreground"
                      >
                        {tm(method)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto flex flex-wrap gap-3 pt-2">
                  <Button asChild>
                    <Link href={cutQuoteHref(cut)} lang={lang("beefCuts.detail.requestQuote")}>
                      {t("requestQuote")}
                    </Link>
                  </Button>
                  {onShowOnCow && (
                    <Button variant="outline" onClick={onShowOnCow} lang={lang("beefCuts.detail.showOnCow")}>
                      {t("showOnCow")}
                    </Button>
                  )}
                </div>
              </div>
            </m.div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
