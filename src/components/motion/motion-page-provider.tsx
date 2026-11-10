"use client";

import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * For pages with many animated elements (Beef Cuts: cut map badges, panel, 18 cards): the
 * animation features come with the page instead of after start-up. When they arrive late, every
 * animated element re-renders at once, which on Beef Cuts was a ~200 ms task (mobile Lighthouse
 * 82 → 88 with this). Pages with few animated elements keep the site-wide late loading
 * (MotionProvider), which is faster there.
 */
export function MotionPageProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
