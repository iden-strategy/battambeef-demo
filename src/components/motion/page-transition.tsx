"use client";

import * as m from "motion/react-m";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { DURATION, EASE_OUT_EXPO, reducedTransition } from "@/components/motion/tokens";
import { useMotionMode } from "@/components/motion/use-motion-prefs";

// Module state: false for the very first page load (server render + hydration), true afterwards.
// The first page is never hidden, so the hero and LCP image show immediately.
let hasNavigated = false;

/**
 * Fired on window when an incoming page has finished rising in (its wrapper no longer moves).
 * Scroll-linked code measures positions; it re-measures on this event.
 */
export const PAGE_SETTLED_EVENT = "bb:page-settled";
const settled = () => window.dispatchEvent(new Event(PAGE_SETTLED_EVENT));

/**
 * Used in app/[locale]/template.tsx. Incoming-only (CLAUDE.md section 8, item 12): on client-side
 * navigation the new page rises 16px and fades in over 0.5s (desktop and touch); the outgoing
 * page is not animated. Reduced motion: a short fade only.
 * No preloader, never blocks content.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const mode = useMotionMode();
  const [animateIn] = useState(() => hasNavigated);

  useEffect(() => {
    hasNavigated = true;
  }, []);

  // Marks <html> after the first client-side navigation, before the new page paints, so
  // first-load-only CSS (the Home hero's header fade-down) does not replay.
  useLayoutEffect(() => {
    if (animateIn) document.documentElement.classList.add("has-navigated");
  }, [animateIn]);

  if (!animateIn) return <div>{children}</div>;

  const reduced = mode === "reduced";
  return (
    <m.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={reduced ? reducedTransition : { duration: DURATION.page, ease: EASE_OUT_EXPO }}
      onAnimationComplete={settled}
    >
      {children}
    </m.div>
  );
}
