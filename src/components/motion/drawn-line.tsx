"use client";

import { useRef, type ReactNode } from "react";
import { useScrollEffect } from "@/components/motion/use-scroll-effect";
import { cn } from "@/lib/utils";

/**
 * A line that draws itself as you scroll (For Business steps). Children mark the line's segments
 * with `data-draw="x"` (horizontal) or `data-draw="y"` (vertical); each axis's segments draw one
 * after another across the scroll range, by scaling from 0 to full length (transform only, it
 * reacts to native scrolling and never controls it).
 * Without JavaScript and with reduced motion the line is simply fully drawn.
 */
export function DrawnLine({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollEffect(
    ref,
    (fx, el, mode) => {
      if (mode === "reduced") return undefined;
      const stops: (() => void)[] = [];
      for (const axis of ["x", "y"] as const) {
        const segments = Array.from(el.querySelectorAll<HTMLElement>(`[data-draw="${axis}"]`));
        const n = segments.length;
        segments.forEach((segment, i) => {
          const from = axis === "x" ? "scaleX(0)" : "scaleY(0)";
          const to = axis === "x" ? "scaleX(1)" : "scaleY(1)";
          stops.push(
            fx.linkScroll(el, segment, { transform: [from, from, to, to] }, {
              times: [0, i / n, (i + 1) / n, 1],
              // From the steps' top at 80% of the screen height to their bottom at 55%.
              offset: ["start 0.8", "end 0.55"],
            }),
          );
        });
      }
      return () => stops.forEach((stop) => stop());
    },
    [],
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      {children}
    </div>
  );
}
