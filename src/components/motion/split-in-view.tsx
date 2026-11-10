"use client";

import { animate } from "motion/mini";
import { useRef, type ReactNode } from "react";
import { staggerDelay } from "@/components/motion/stagger";
import { DURATION, EASE_OUT_EXPO } from "@/components/motion/tokens";
import { useInViewReveal } from "@/components/motion/use-in-view-reveal";

type SplitInViewProps = {
  children: ReactNode;
  step: number;
  delay: number;
  duration: number;
  amount: number;
  once: boolean;
  /** CSS length each piece rises from. */
  rise: string;
  /** Starting tilt in degrees. */
  tilt: number;
};

const pieces = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>("[data-piece]"));

/**
 * In-view half of SplitTextReveal: animates the server-rendered [data-piece] spans with
 * browser-native animations (motion/mini).
 */
export function SplitInView({ children, step, delay, duration, amount, once, rise, tilt }: SplitInViewProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useInViewReveal(
    ref,
    (el, mode) => {
      const targets = pieces(el);
      if (mode === "reduced") {
        // The whole line fades in quickly; nothing moves.
        const controls = animate(targets, { opacity: [0, 1] }, { duration: DURATION.reducedFade, ease: "linear" });
        return () => controls.stop();
      }
      const blur = mode === "fine"; // desktop only; phones never blur
      const from = tilt ? `translateY(${rise}) rotate(${tilt}deg)` : `translateY(${rise})`;
      const keyframes = { opacity: [0, 1], transform: [from, "none"] };
      const controls = animate(targets, blur ? { ...keyframes, filter: ["blur(8px)", "blur(0px)"] } : keyframes, {
        duration,
        ease: EASE_OUT_EXPO,
        delay: staggerDelay(step, delay),
      });
      return () => controls.stop();
    },
    {
      amount,
      once,
      reset: (el) => pieces(el).forEach((p) => (p.style.opacity = "0")),
    },
  );

  return (
    <span ref={ref} aria-hidden data-reveal="split" className="inline">
      {children}
    </span>
  );
}
