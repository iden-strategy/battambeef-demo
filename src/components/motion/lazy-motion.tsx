"use client";

import { LazyMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

const loadAnimation = () => import("@/components/motion/features-animation").then((mod) => mod.default);

/**
 * Wraps the whole site (layout). Animated elements use the small `m` components
 * (`import * as m from "motion/react-m"`); their animation features download as a separate
 * chunk right after start-up instead of being part of every page's first JavaScript.
 * Until they arrive, `m` elements render in their initial state, which is how they look anyway
 * (nothing animates before the page is interactive).
 *
 * Pages with many animated elements wrap their content in MotionPageProvider
 * (motion-page-provider.tsx) instead, and blocks with layout animations in MotionMaxProvider
 * (motion-max-provider.tsx).
 *
 * Also marks the app as started (`app-ready` on <html>), which cancels the head script's
 * stall failsafe (layout.tsx).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("app-ready");
  }, []);
  return <LazyMotion features={loadAnimation}>{children}</LazyMotion>;
}
