"use client";

import { AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { LanguageSwitch } from "@/components/shell/language-switch";
import { MobileMenu } from "@/components/shell/mobile-menu";
import { isActivePath } from "@/components/shell/nav-utils";
import { useShell } from "@/components/shell/shell-context";
import { Link, usePathname } from "@/i18n/navigation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { NavItem } from "@/lib/data";
import { cn } from "@/lib/utils";

/** "photo": over the Home hero photo (transparent, charcoal text until scrolled). */
type HeaderTheme = "light" | "dark" | "photo";

// Top-level surfaces only (nested demo panels don't count).
const SURFACE_SELECTOR =
  "#main-content [data-surface]:not(#main-content [data-surface] [data-surface]), #site-footer";

// Elements that sit outside the menu and must be unreachable while it is open.
const OUTSIDE_MENU = ["skip-link", "main-content", "site-footer", "bottom-bar"];

export function SiteHeader({ navItems }: { navItems: NavItem[] }) {
  const t = useTranslations();
  const lang = useFallbackLang();
  const pathname = usePathname();
  const { menuOpen, setMenuOpen } = useShell();
  const [theme, setTheme] = useState<HeaderTheme | null>(null);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // --- Surface detection: a 1px line through the middle of the header ----------------------
  // Light and kraft sections turn the header light; the hero photo (data-header="photo") gives
  // charcoal text on a transparent bar; everything else (the dark default) keeps it dark. Sections added after load (client navigation, streamed content) are picked up too.
  useLayoutEffect(() => {
    const bar = barRef.current;
    const main = document.getElementById("main-content");
    if (!bar) return;
    const toTheme = (el: Element): HeaderTheme => {
      if (el.getAttribute("data-header") === "photo") return "photo";
      const s = el.getAttribute("data-surface");
      return s === "light" || s === "kraft" ? "light" : "dark";
    };

    let observer: IntersectionObserver | null = null;
    const observe = () => {
      observer?.disconnect();
      const surfaces = Array.from(document.querySelectorAll<HTMLElement>(SURFACE_SELECTOR));

      // Synchronous pick so the header doesn't flash the wrong colour.
      const lineY = bar.offsetHeight / 2;
      const under = surfaces.find((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= lineY && r.bottom > lineY;
      });
      if (under) setTheme(toTheme(under));

      const mid = Math.round(bar.offsetHeight / 2);
      observer = new IntersectionObserver(
        (entries) => {
          const hit = entries.filter((e) => e.isIntersecting).at(-1);
          if (hit) setTheme(toTheme(hit.target));
        },
        { rootMargin: `-${mid}px 0px -${Math.max(window.innerHeight - mid - 1, 0)}px 0px` },
      );
      surfaces.forEach((el) => observer!.observe(el));
    };
    observe();

    // Re-scan (at most once per frame) when sections are added, removed or change surface.
    let frame = 0;
    const rescan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(observe);
    };
    const mutations = new MutationObserver(rescan);
    if (main) mutations.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-surface"] });
    window.addEventListener("resize", rescan);
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer?.disconnect();
      window.removeEventListener("resize", rescan);
    };
  }, [pathname]);

  // --- Hide on scroll down, show on scroll up ---------------------------------------------
  // One passive listener, read once per frame. The slide itself is a CSS transition
  // (globals.css, .site-header): 0.35s expo-out, instant with reduced motion.
  useEffect(() => {
    // Starts from 0 (as Motion's scroll value did): a page that was already scrolled down
    // before start-up counts as a scroll down, so the header hides.
    let prev = 0;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - prev;
      prev = y;
      setScrolled(y > 8);
      if (y < 80) setHidden(false);
      else if (delta > 6) setHidden(true);
      else if (delta < -6) setHidden(false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // --- Menu: focus trap, Escape, scroll lock, inert background ------------------------------
  const closeMenu = useCallback(
    (returnFocus = true) => {
      setMenuOpen(false);
      if (returnFocus) requestAnimationFrame(() => menuButtonRef.current?.focus());
    },
    [setMenuOpen],
  );

  // --- After navigating from the mobile menu, move focus to the new page's content ---------
  const focusMainOnNavigate = useRef(false);
  useEffect(() => {
    if (!focusMainOnNavigate.current) return;
    focusMainOnNavigate.current = false;
    requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
  }, [pathname]);

  const onMenuNavigate = useCallback(
    (href: string) => {
      closeMenu(false);
      if (pathname === href) {
        // Same page: no navigation will happen, so focus the content now.
        requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
      } else {
        focusMainOnNavigate.current = true;
      }
    },
    [closeMenu, pathname],
  );

  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const outside = OUTSIDE_MENU.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    outside.forEach((el) => (el.inert = true));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== "Tab" || !shellRef.current) return;
      const focusables = Array.from(
        shellRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // Close if the window grows to desktop width while open.
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onDesktop = (e: MediaQueryListEvent) => e.matches && closeMenu(false);
    desktop.addEventListener("change", onDesktop);

    return () => {
      root.style.overflow = prevOverflow;
      outside.forEach((el) => (el.inert = false));
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [menuOpen, closeMenu]);

  const effectiveTheme: HeaderTheme | "auto" = menuOpen ? "dark" : (theme ?? "auto");
  const isHidden = hidden && !menuOpen;

  // Shared with in-page sticky bars (e.g. the Farm to Table progress bar), which move up into
  // the header's space while it is hidden.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-header-hidden", isHidden);
  }, [isHidden]);

  return (
    <div ref={shellRef}>
      <header
        ref={barRef}
        data-theme={effectiveTheme}
        data-scrolled={scrolled && !menuOpen ? "true" : undefined}
        data-hidden={isHidden ? "true" : undefined}
        data-surface={effectiveTheme === "light" ? "light" : "dark"}
        className="site-header fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]"
        onFocusCapture={() => setHidden(false)}
      >
        <div className="container-page flex h-[var(--header-h)] items-center justify-between gap-4">
          {/* Logo: 36px tall (44px from 1024px) with at least 14px clear space above and below;
              the link is the 44px+ tap target. */}
          <Link
            href="/"
            aria-label={t("header.logo")}
            onClick={() => menuOpen && closeMenu(false)}
            className="-my-1 inline-flex shrink-0 items-center py-1"
          >
            <BrandLogo variant="auto" className="h-9 lg:h-11" />
          </Link>

          {/* aria-labelledby (not aria-label) so the name can carry its own language. */}
          <span id="nav-label" hidden lang={lang("nav.label")}>
            {t("nav.label")}
          </span>
          <nav aria-labelledby="nav-label" className="hidden lg:block">
            <ul className="flex items-center xl:gap-2">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      lang={lang(`nav.${item.key}`)}
                      className={cn(
                        "inline-flex min-h-11 items-center px-2 text-[0.875rem] font-medium whitespace-nowrap underline-offset-[6px]",
                        active ? "underline decoration-2" : "hover:underline",
                      )}
                    >
                      {t(`nav.${item.key}`)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitch className="hidden lg:flex" />
            {/* From 1280px; between 1024 and 1279 the nav's own "Contact" link covers it. */}
            <MagneticButton className="hidden xl:inline-flex">
              <Button asChild size="sm">
                <Link href="/contact" lang={lang("header.contactUs")}>
                  {t("header.contactUs")}
                </Link>
              </Button>
            </MagneticButton>
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              lang={lang(menuOpen ? "nav.closeMenu" : "nav.openMenu")}
              onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-full lg:hidden"
            >
              {menuOpen ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <MobileMenu navItems={navItems} pathname={pathname} onNavigate={onMenuNavigate} onClose={() => closeMenu(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
