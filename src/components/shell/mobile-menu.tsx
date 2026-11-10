"use client";

import type { Variants } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useMotionMode } from "@/components/motion/use-motion-prefs";
import { EASE_OUT_EXPO, reducedTransition } from "@/components/motion/tokens";
import { LanguageSwitch } from "@/components/shell/language-switch";
import { isActivePath } from "@/components/shell/nav-utils";
import { Link } from "@/i18n/navigation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { NavItem } from "@/lib/data";
import { cn } from "@/lib/utils";

type MobileMenuProps = {
  navItems: NavItem[];
  pathname: string;
  /** A nav link was chosen: close, then focus the new page's content. */
  onNavigate: (href: string) => void;
  /** Close without navigating inside the app (the language switch loads a new page). */
  onClose: () => void;
};

/**
 * Full-screen charcoal menu below 1024px. Links rise in with a stagger (fade only with reduced
 * motion). Focus trap, Escape and scroll lock live in SiteHeader, which owns the open state.
 */
export function MobileMenu({ navItems, pathname, onNavigate, onClose }: MobileMenuProps) {
  const t = useTranslations("nav");
  const lang = useFallbackLang();
  const mode = useMotionMode();
  const reduced = mode === "reduced";
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    firstLink.current?.focus();
  }, []);

  const list: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : 0.055, delayChildren: reduced ? 0 : 0.08 } },
  };
  const item: Variants = reduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: reducedTransition } }
    : {
        hidden: { opacity: 0, y: 36 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT_EXPO } },
      };

  return (
    <m.div
      id="site-menu"
      // No aria-modal: the header's close button sits outside this panel and must stay reachable
      // for screen readers. The rest of the page is made inert by SiteHeader instead.
      role="dialog"
      aria-labelledby="site-menu-label"
      data-surface="dark"
      className="fixed inset-0 z-40 flex h-dvh flex-col overflow-y-auto overscroll-contain pt-[calc(var(--header-h)+env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: reduced ? 0.2 : 0.3 }}
    >
      <span id="site-menu-label" hidden lang={lang("nav.menuLabel")}>
        {t("menuLabel")}
      </span>
      <nav aria-labelledby="nav-label" className="container-page flex flex-1 flex-col justify-center py-8">
        <m.ul className="flex flex-col gap-1" variants={list} initial="hidden" animate="visible">
          {navItems.map((nav, i) => {
            const active = isActivePath(pathname, nav.href);
            return (
              <m.li key={nav.key} variants={item}>
                <Link
                  ref={i === 0 ? firstLink : undefined}
                  href={nav.href}
                  onClick={() => onNavigate(nav.href)}
                  aria-current={active ? "page" : undefined}
                  lang={lang(`nav.${nav.key}`)}
                  className={cn(
                    "title-lg inline-flex min-h-11 items-center py-1 [--fs:clamp(2rem,8.5vw,3.5rem)]",
                    active ? "text-accent-text" : "text-foreground",
                  )}
                >
                  {t(nav.key)}
                </Link>
              </m.li>
            );
          })}
        </m.ul>
      </nav>
      <m.div
        className="container-page flex items-center justify-between border-t border-border pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: reduced ? 0 : 0.4, duration: 0.3 } }}
      >
        <LanguageSwitch size="lg" onSwitch={onClose} />
      </m.div>
    </m.div>
  );
}
