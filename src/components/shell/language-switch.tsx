"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useSyncExternalStore } from "react";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import { cn } from "@/lib/utils";

const SCROLL_KEY = "bb:locale-scroll";

// sessionStorage can throw (blocked storage, some private modes, sandboxed frames). Every access
// goes through these helpers, and any failure simply means "nothing saved".
const storage = {
  get(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      /* nothing saved */
    }
  },
  remove(key: string) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* nothing saved */
    }
  },
};

// The current ?query and #hash, so switching language keeps them. Empty on the server, so the
// plain links still work without JavaScript (they just drop the query and hash).
const subscribeToUrl = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
  };
};
const readUrlSuffix = () => window.location.search + window.location.hash;
const noSuffix = () => "";

type LanguageSwitchProps = {
  className?: string;
  size?: "sm" | "lg";
  onSwitch?: () => void;
};

/**
 * EN / ខ្មែរ. Plain links to the same page in the other language (work without JavaScript).
 * Deliberately a full page load: a client-side switch would keep the old language's whole
 * layout mounted (hidden) next to the new one, with duplicate ids. <LocaleScrollRestore>
 * puts the reader back at the same scroll position.
 *
 * Storage note: the switch keeps one value in sessionStorage, the scroll position (a number),
 * for the length of that page load only. It is read and deleted on the next page and never
 * leaves the browser. No cookies, no personal data, nothing sent anywhere. If storage is
 * unavailable the switch still works; it just opens at the top of the page.
 */
export function LanguageSwitch({ className, size = "sm", onSwitch }: LanguageSwitchProps) {
  const t = useTranslations("language");
  const lang = useFallbackLang();
  const locale = useLocale();
  const pathname = usePathname();
  const suffix = useSyncExternalStore(subscribeToUrl, readUrlSuffix, noSuffix);

  return (
    // Each link carries its own lang, so the group's lang only applies to its label.
    <div role="group" aria-label={t("label")} lang={lang("language.label")} className={cn("flex items-center", className)}>
      {routing.locales.map((l: AppLocale, i) => {
        const current = l === locale;
        return (
          <span key={l} className="flex items-center">
            {i > 0 && (
              <span aria-hidden className="mx-1 opacity-40">
                /
              </span>
            )}
            <a
              href={getPathname({ href: pathname, locale: l }) + suffix}
              lang={l}
              hrefLang={l}
              aria-current={current ? "true" : undefined}
              aria-label={l === "en" ? t("enFull") : t("kmFull")}
              onClick={(e) => {
                // Read the query and hash again at click time, in case they changed without a re-render.
                e.currentTarget.href = getPathname({ href: pathname, locale: l }) + readUrlSuffix();
                if (!current) storage.set(SCROLL_KEY, String(window.scrollY));
                onSwitch?.();
              }}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 font-semibold",
                size === "sm" ? "text-sm" : "text-lg",
                l === "km" ? "font-khmer" : "font-sans",
                current ? "opacity-100 underline decoration-2 underline-offset-[6px]" : "opacity-70 hover:opacity-100",
              )}
            >
              {l === "en" ? t("en") : t("km")}
            </a>
          </span>
        );
      })}
    </div>
  );
}

/** Restores the scroll position after a language switch that caused a full page load. */
export function LocaleScrollRestore() {
  const locale = useLocale();
  useEffect(() => {
    const saved = storage.get(SCROLL_KEY);
    if (saved === null) return;
    storage.remove(SCROLL_KEY);
    const y = Number(saved);
    if (Number.isFinite(y) && Math.abs(window.scrollY - y) > 2) window.scrollTo({ top: y, behavior: "instant" });
  }, [locale]);
  return null;
}
