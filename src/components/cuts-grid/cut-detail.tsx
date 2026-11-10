"use client";

import * as m from "motion/react-m";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { CutImage } from "@/components/cuts-grid/cut-image";
import { EASE_OUT_EXPO } from "@/components/motion/tokens";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { CowPartGeometry } from "@/lib/data/cow-map";
import type { Cut } from "@/lib/data/cuts";
import { quoteHref } from "@/lib/quote-link";

export type CutDetailProps = {
  cut: Cut;
  part: CowPartGeometry;
  partName: string;
  totalParts: number;
  tierName: string;
  imageLayoutId?: string;
  reduced: boolean;
  onClose: () => void;
  onShowOnCow: () => void;
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
  part,
  partName,
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

              <m.div
                layoutId={imageLayoutId}
                className="relative aspect-[16/10] w-full overflow-hidden md:aspect-auto md:min-h-80"
              >
                <CutImage cut={cut} alt={cut.nameEn} soonLabel={tg("photoSoon")} sizes="(min-width: 768px) 448px, 92vw" />
              </m.div>

              <div className="flex flex-col gap-5 p-6 md:p-8">
                <div>
                  <p className="label tabular text-label">
                    {cut.code ? `${cut.code} · ` : ""}
                    <span lang={lang("cutMap.partOf")}>{tc("partOf", { n: part.number, total: totalParts })}</span>
                  </p>
                  <Dialog.Title lang="en" className="title-md mt-2">
                    {cut.nameEn}
                  </Dialog.Title>
                  {cut.nameKm && (
                    <p lang="km" className="font-khmer mt-1 text-[1.0625rem] leading-[1.7]">
                      {cut.nameKm}
                    </p>
                  )}
                  {cut.toConfirm && (
                    <p className="mt-1 text-xs text-muted-foreground italic" lang={lang("cutMap.toConfirm")}>
                      {tc("toConfirm")}
                    </p>
                  )}
                </div>

                <Dialog.Description className="body text-muted-foreground" lang={lang("beefCuts.detail.description")}>
                  {t("description", { part: partName, tier: tierName })}
                </Dialog.Description>

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
                    <Link href={quoteHref(cut.part, cut.id)} lang={lang("beefCuts.detail.requestQuote")}>
                      {t("requestQuote")}
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={onShowOnCow} lang={lang("beefCuts.detail.showOnCow")}>
                    {t("showOnCow")}
                  </Button>
                </div>
              </div>
            </m.div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
