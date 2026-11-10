"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";
import { useMotionMode, type MotionMode } from "@/components/motion/use-motion-prefs";

type Effects = typeof import("@/components/motion/scroll-effects");

/**
 * Runs a scroll-linked effect on `ref`'s element once the motion mode is known, downloading the
 * scroll code (scroll-effects.ts) only then. `setup` gets the module, the element and the mode
 * ("reduced", "fine" or "touch": decide there what moves) and returns a cleanup. It runs again
 * when the element's height changes, so offsets measured from the viewport stay right.
 */
export function useScrollEffect<T extends HTMLElement>(
  ref: RefObject<T | null>,
  setup: (fx: Effects, el: T, mode: Exclude<MotionMode, "ssr">) => (() => void) | undefined,
  deps: unknown[],
) {
  const mode = useMotionMode();
  const run = useEffectEvent(setup);

  useEffect(() => {
    const el = ref.current;
    if (mode === "ssr" || !el) return;
    let live = true;
    let fx: Effects | null = null;
    let cleanup: (() => void) | undefined;
    let height = el.offsetHeight;
    let viewport = window.innerHeight;
    const start = () => {
      cleanup?.();
      cleanup = fx ? run(fx, el, mode) : undefined;
    };

    import("@/components/motion/scroll-effects").then((mod) => {
      if (!live) return;
      fx = mod;
      start();
    });

    // Re-measure when the element or the viewport changes height (rotation, browser bars).
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (el.offsetHeight === height && window.innerHeight === viewport) return;
        height = el.offsetHeight;
        viewport = window.innerHeight;
        start();
      });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    window.addEventListener("resize", onResize);

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's effect inputs
  }, [mode, ...deps]);
}
