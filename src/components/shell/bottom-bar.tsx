"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { MessageCircle, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useMotionMode } from "@/components/motion/use-motion-prefs";
import { useShell } from "@/components/shell/shell-context";
import { Link } from "@/i18n/navigation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { QuickActions } from "@/lib/data";

type BottomBarProps = { contact: QuickActions["contact"]; quoteHref: string };

// Labels may wrap to two lines on the narrowest phones instead of being cut off.
const ACTION = "h-12 w-full px-3 text-center text-[0.8125rem] whitespace-normal";
// English wraps at 1.25; Khmer needs 1.4 so stacked vowels and subscripts are never clipped.
const LABEL = "block leading-tight [&:lang(km)]:leading-[1.4]";

/**
 * Sticky quick actions below 768px, on the dark base. Sits above the bottom safe area, hides
 * while the menu is open, and a matching spacer at the end of the page keeps it from covering
 * content.
 */
export function BottomBar({ contact, quoteHref }: BottomBarProps) {
  const t = useTranslations("bottomBar");
  const tNewTab = useTranslations("a11y");
  const lang = useFallbackLang();
  const { menuOpen } = useShell();
  const mode = useMotionMode();

  return (
    <AnimatePresence initial={false}>
      {!menuOpen && (
        <m.div
          id="bottom-bar"
          role="region"
          aria-labelledby="bottom-bar-label"
          data-surface="dark"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-white/12 bg-[color-mix(in_srgb,var(--charcoal)_94%,transparent)] md:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={mode === "reduced" ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <span id="bottom-bar-label" hidden lang={lang("bottomBar.label")}>
            {t("label")}
          </span>
          <div className="container-page grid h-[var(--bottom-bar-h)] grid-cols-2 items-center gap-3">
            <Button asChild variant="outline" size="sm" className={ACTION}>
              {/* Telegram once a handle is in the site data; until then, the Contact page. */}
              {contact.kind === "telegram" ? (
                <a href={contact.href} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden className="hidden xs:block" />
                  <span className={LABEL} lang={lang("bottomBar.telegram")}>
                    {t("telegram")}
                    {" "}
                    <span className="sr-only" lang={lang("a11y.newTab")}>
                      {tNewTab("newTab")}
                    </span>
                  </span>
                </a>
              ) : (
                <Link href={contact.href}>
                  <MessageCircle aria-hidden className="hidden xs:block" />
                  <span className={LABEL} lang={lang("bottomBar.contactUs")}>
                    {t("contactUs")}
                  </span>
                </Link>
              )}
            </Button>
            <Button asChild size="sm" className={ACTION}>
              <Link href={quoteHref}>
                <FileText aria-hidden className="hidden xs:block" />
                <span className={LABEL} lang={lang("bottomBar.quote")}>
                  {t("quote")}
                </span>
              </Link>
            </Button>
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function BottomBarSpacer() {
  return <div aria-hidden className="h-[calc(var(--bottom-bar-h)+env(safe-area-inset-bottom))] md:hidden" />;
}
