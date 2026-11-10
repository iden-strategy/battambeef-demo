"use client";

import { inView } from "motion";
import { useEffect, useEffectEvent, type RefObject } from "react";
import { readMotionMode, type MotionMode } from "@/components/motion/use-motion-prefs";

export type RevealMode = Exclude<MotionMode, "ssr">;

type Options = {
  /** Fraction of the element that must be visible before it plays. */
  amount?: number;
  /** Play only the first time (default). Otherwise `reset` runs when it leaves the screen. */
  once?: boolean;
  reset?: (el: HTMLElement) => void;
  enabled?: boolean;
};

/**
 * Shared engine of the in-view reveals.
 *
 * The server HTML is fully visible. Before first paint, a tiny script in <head> adds
 * `js-motion` to <html>, and CSS hides `[data-reveal]` elements only under that class.
 * After hydration this hook marks the page `motion-ready` (which cancels the CSS failsafe) and
 * runs `play` when the element scrolls into view. `play` reads the motion mode at that moment,
 * so a reduced-motion change switches the animation settings without remounting anything.
 * `play` must animate from explicit keyframes and leave the element visible when done.
 */
export function useInViewReveal(
  ref: RefObject<HTMLElement | null>,
  play: (el: HTMLElement, mode: RevealMode) => (() => void) | void,
  { amount = 0.25, once = true, reset, enabled = true }: Options = {},
) {
  const onEnter = useEffectEvent((el: HTMLElement) => play(el, readMotionMode()));
  const onLeave = useEffectEvent((el: HTMLElement) => reset?.(el));

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    document.documentElement.classList.add("motion-ready");

    // A tall element can never be 25% visible on a short phone screen, so it would never play.
    // Cap the threshold at what fits in 80% of the viewport.
    const threshold = el.offsetHeight > 0 ? Math.min(amount, (window.innerHeight * 0.8) / el.offsetHeight) : amount;

    let stopAnimation: (() => void) | void;
    const stopObserving = inView(
      el,
      () => {
        stopAnimation = onEnter(el);
        if (once) {
          queueMicrotask(() => stopObserving());
          return;
        }
        return () => {
          stopAnimation?.();
          onLeave(el);
        };
      },
      { amount: threshold },
    );
    return () => {
      stopObserving();
      stopAnimation?.();
    };
  }, [ref, amount, once, enabled]);
}
