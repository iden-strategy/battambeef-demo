"use client";

import { ChevronDown } from "lucide-react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useMotionMode } from "@/components/motion/use-motion-prefs";
import { EASE_OUT_EXPO } from "@/components/motion/tokens";
import { isActivePath, navCurrent } from "@/components/shell/nav-utils";
import { Link } from "@/i18n/navigation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { NavItem } from "@/lib/data";
import { cn } from "@/lib/utils";

/** How long the panel stays open after the mouse leaves, so it can travel into the panel. */
const CLOSE_DELAY_MS = 150;

/** The desktop header (and so this dropdown) shows from 1024px (Tailwind `lg`). */
const DESKTOP_QUERY = "(min-width: 64rem)";

/** closed; open because the mouse is over it; open because the chevron was clicked/tapped/pressed. */
type DropdownState = "closed" | "hover" | "pinned";

type NavDropdownProps = {
  /** A nav item with `children`: they fill the panel. */
  item: NavItem;
  pathname: string;
  /** The header slid away on scroll: the panel closes with it. */
  headerHidden: boolean;
};

// true on the client after hydration, false on the server and while hydrating (no flash, no effect).
const subscribeNever = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

/**
 * Desktop menu item with a disclosure panel (For Business → Overview · Beef Cuts · Beef Knowledge).
 * The label stays a plain link; the chevron button next to it shows and hides the panel
 * (disclosure pattern: aria-expanded + aria-controls, plain Tab order, no role="menu").
 *
 * - Mouse: opens on hover over the item, closes 150ms after the pointer leaves.
 * - Click, tap or Enter/Space on the chevron "pins" it open (a click right after hovering keeps
 *   it open instead of closing it); the next press closes it. Touch never triggers hover.
 * - Closes on Escape (focus back to the chevron), focus leaving the item, a press outside,
 *   choosing a link, a route change, the header hiding on scroll and the window getting narrower
 *   than the desktop header. Whenever it closes with focus inside the panel, focus goes to the
 *   chevron (or to the page content after choosing a link), never to the page top.
 * The panel is always in the DOM (visibility: hidden when closed, so it is neither focusable nor
 * announced) and absolutely positioned, so opening it never moves the page. Without JavaScript
 * the chevron stays invisible (it would do nothing) and the label is still a working link.
 */
export function NavDropdown({ item, pathname, headerHidden }: NavDropdownProps) {
  const t = useTranslations();
  const lang = useFallbackLang();
  const reduced = useMotionMode() === "reduced";
  const hydrated = useHydrated();
  const [state, setState] = useState<DropdownState>("closed");
  const [prevPathname, setPrevPathname] = useState(pathname);
  const itemRef = useRef<HTMLLIElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  /** A panel link was chosen and the page is about to change: focus goes to the content, not the chevron. */
  const focusMainOnNavigate = useRef(false);
  const open = state !== "closed";
  const panelId = `${item.key}-menu`;
  const subItems = item.children ?? [];

  // Route change, or the header hid: close (adjusting state during render, no effect needed).
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (open) setState("closed");
  } else if (headerHidden && open) {
    setState("closed");
  }

  const cancelClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = undefined;
  };
  const close = () => {
    cancelClose();
    setState("closed");
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // However it closed (hover timer, header hiding, route change, resize, Escape): focus inside the
  // panel is about to be lost to the page top (the panel turns invisible), so hand it to the chevron.
  useEffect(() => {
    if (open || focusMainOnNavigate.current) return;
    const active = document.activeElement;
    if (active && panelRef.current?.contains(active)) buttonRef.current?.focus();
  }, [open]);

  // After choosing a panel link, move focus to the new page's content (like the mobile menu).
  useEffect(() => {
    if (!focusMainOnNavigate.current) return;
    focusMainOnNavigate.current = false;
    requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
  }, [pathname]);

  const onChoose = (e: MouseEvent, href: string) => {
    close();
    // Ctrl/Cmd/Shift/middle click opens elsewhere: this page stays, so focus returns to the chevron.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (pathname === href) {
      // Same page: no navigation will happen, so focus the content now.
      requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
    } else {
      focusMainOnNavigate.current = true;
    }
  };

  // While open: Escape, presses outside the item, and the window dropping below desktop width
  // close it. All listeners are removed when it closes or unmounts.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const focusInside = !!itemRef.current?.contains(document.activeElement);
      window.clearTimeout(closeTimer.current);
      setState("closed");
      if (focusInside) {
        e.preventDefault();
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (e.target instanceof Node && itemRef.current?.contains(e.target)) return;
      window.clearTimeout(closeTimer.current);
      setState("closed");
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onViewport = (e: MediaQueryListEvent) => {
      if (e.matches) return;
      window.clearTimeout(closeTimer.current);
      setState("closed");
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onViewport);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onViewport);
    };
  }, [open]);

  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    cancelClose();
    setState((s) => (s === "closed" ? "hover" : s));
  };

  const onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || state !== "hover") return;
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = undefined;
      setState((s) => (s === "hover" ? "closed" : s));
    }, CLOSE_DELAY_MS);
  };

  // Focus moved to something outside the item (Tab past the last link, Shift+Tab before the label).
  const onBlur = (e: FocusEvent) => {
    const next = e.relatedTarget;
    if (open && next instanceof Node && !itemRef.current?.contains(next)) close();
  };

  // Enter/Space/click on the chevron while the panel is open only because the mouse is hovering
  // pins it open instead of closing it: someone who hovers and then presses the chevron wants the
  // panel to stay (closing it would look like the press did nothing, or flicker it shut). Keyboard
  // and touch users never hover, so for them the same press simply toggles. The next press closes it.
  const toggle = () => {
    cancelClose();
    setState((s) => (s === "pinned" ? "closed" : "pinned"));
  };

  const active = isActivePath(pathname, item.href);
  const transition = reduced ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT_EXPO };

  return (
    <li
      ref={itemRef}
      className="relative flex items-center"
      data-state={open ? "open" : "closed"}
      data-mode={open ? state : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onBlur={onBlur}
    >
      <Link
        href={item.href}
        aria-current={navCurrent(pathname, item.href)}
        lang={lang(`nav.${item.key}`)}
        className={cn(
          "inline-flex min-h-11 items-center text-[0.875rem] font-medium whitespace-nowrap underline-offset-[6px]",
          active ? "underline decoration-2" : "hover:underline",
        )}
      >
        {t(`nav.${item.key}`)}
      </Link>
      {/* In the layout the button ends where the drawn chevron ends (15px: the outer edge of its
          stroke), so the list's gap is the visible gap after it. The 44×44 tap area is an invisible
          ::before that takes no space: it starts at the end of the label and reaches into the gap,
          3px short of the next item. The 14px icon sits 4px from the label (2px wrapper margin +
          2px inside the wrapper); the 18px wrapper overflows the button on the right (harmless). */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t("nav.businessPages")}
        lang={lang("nav.businessPages")}
        onClick={toggle}
        className={cn(
          "group/chevron relative inline-flex h-11 w-[15px] items-center outline-none before:absolute before:inset-y-0 before:left-0 before:w-11 before:content-['']",
          !hydrated && "invisible",
        )}
      >
        {/* Hover: soft fill. Keyboard focus (focus-visible only): ring. Neither moves the icon. */}
        <span
          data-chevron-icon
          className="ml-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 group-focus-visible/chevron:outline-2 group-focus-visible/chevron:outline-offset-0 group-focus-visible/chevron:outline-[var(--ring)] [@media(hover:hover)]:group-hover/chevron:bg-foreground/10"
        >
          <m.span
            aria-hidden
            className="inline-flex"
            initial={false}
            animate={{ rotate: open ? 180 : 0 }}
            transition={transition}
          >
            <ChevronDown className="size-3.5" strokeWidth={2.25} />
          </m.span>
        </span>
      </button>

      {/* The top padding is a transparent bridge, so the pointer can cross into the panel. */}
      <m.div
        ref={panelRef}
        id={panelId}
        className="absolute top-full left-0 z-10 pt-2"
        initial={false}
        animate={
          open
            ? { opacity: 1, y: 0, visibility: "visible" }
            : { opacity: 0, y: reduced ? 0 : -6, transitionEnd: { visibility: "hidden" } }
        }
        transition={transition}
      >
        <ul
          data-surface="dark"
          className="min-w-[15rem] rounded-xl border border-border bg-card p-2 shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)]"
        >
          {subItems.map((sub) => {
            const current = pathname === sub.href;
            return (
              <li key={sub.key}>
                <Link
                  href={sub.href}
                  aria-current={current ? "page" : undefined}
                  lang={lang(`businessNav.${sub.key}`)}
                  onClick={(e) => onChoose(e, sub.href)}
                  className={cn(
                    "body-sm flex min-h-11 items-center rounded-lg px-3 font-medium whitespace-nowrap transition-colors duration-150 [--fs:0.9375rem]",
                    current ? "text-accent-text" : "text-foreground [@media(hover:hover)]:hover:bg-foreground/8",
                  )}
                >
                  {t(`businessNav.${sub.key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </m.div>
    </li>
  );
}
