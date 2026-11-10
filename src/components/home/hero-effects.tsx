"use client";

import { useRef, type ComponentProps } from "react";
import { usePointerEffect } from "@/components/motion/use-pointer-effect";
import { useScrollEffect } from "@/components/motion/use-scroll-effect";

/** How far the hero has to scroll for the melt to be complete, as a share of the viewport. */
const MELT_AT = 0.6;

/**
 * The hero <section>, with its two effects. Everything inside is server-rendered (hero.tsx);
 * this only finds the layers by their data attributes:
 * - [data-depth="scene"]: the photo and the cow, which always move together (both photos contain
 *   the cow, so any difference between them would show a ghost outline)
 * - [data-depth="title"]: the title, which moves against them
 * - [data-hero-stage], [data-hero-title-scroll], [data-hero-melt], for scrolling
 *
 * Pointer depth: desktop with a fine pointer only (pointer-effects.ts is never downloaded on
 * touch or with reduced motion).
 * Scroll: the stage drifts down at 0.3× the scroll and the title rises a little faster than the
 * cow, so it slides further behind it; a charcoal gradient rises from the bottom, complete at 60%
 * of a viewport. Reduced motion: only the gradient fades in, nothing moves.
 */
export function HeroEffects(props: ComponentProps<"section">) {
  const ref = useRef<HTMLElement>(null);

  usePointerEffect((fx) => {
    const root = ref.current;
    if (!root) return;
    const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
    return fx.attachDepth(root, [
      ...q('[data-depth="scene"]').map((el) => ({ el, amount: -1.2 })),
      ...q('[data-depth="title"]').map((el) => ({ el, amount: 0.6 })),
    ]);
  }, []);

  useScrollEffect(
    ref,
    (fx, root, mode) => {
      const one = (sel: string) => root.querySelector<HTMLElement>(sel);
      const stage = one("[data-hero-stage]");
      const title = one("[data-hero-title-scroll]");
      const melt = one("[data-hero-melt]");
      // The melt completes at 60% of a viewport scrolled, whatever the hero's height.
      const at = Math.min(1, (MELT_AT * window.innerHeight) / root.offsetHeight);
      const times = [0, at, 1];
      const stops: (() => void)[] = [];

      if (melt) {
        stops.push(
          fx.linkScroll(
            root,
            melt,
            mode === "reduced"
              ? { opacity: [0, 1, 1] }
              : { opacity: [0, 1, 1], transform: ["translateY(30%)", "none", "none"] },
            { times },
          ),
        );
      }
      if (mode !== "reduced") {
        if (stage) stops.push(fx.linkScroll(root, stage, { transform: ["none", "translateY(30%)"] }));
        if (title) stops.push(fx.linkScroll(root, title, { transform: ["none", "translateY(-7%)"] }));
      }
      return () => stops.forEach((stop) => stop());
    },
    [],
  );

  return <section ref={ref} {...props} />;
}
