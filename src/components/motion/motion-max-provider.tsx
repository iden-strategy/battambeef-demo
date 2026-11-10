"use client";

import { LazyMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";

type MotionMaxProviderProps = { children: ReactNode; className?: string };

/**
 * Adds layout animations (layout, layoutId) and drag for the components inside it, rendered in a
 * plain <div>. The features (and the layout tracking they set up for every element, e.g. the
 * 18 cards of the cuts grid) load when this block comes within a quarter screen of the viewport, not
 * during start-up: done at start-up, that set-up was the largest single task on Beef Cuts
 * (blocking time 131 → 271–355 ms). Until then the elements render normally, without layout
 * animation; by the time the block is on screen, it is ready.
 */
export function MotionMaxProvider({ children, className }: MotionMaxProviderProps) {
  const ref = useRef<HTMLDivElement>(null);
  // A promise that resolves when the block is near the viewport; LazyMotion waits for it.
  const [near] = useState(() => {
    let resolve = () => {};
    const promise = new Promise<void>((r) => (resolve = r));
    return { promise, resolve };
  });
  // Marks the block data-motion-max="ready" once the features have arrived (tests wait for it).
  const [loadFeatures] = useState(
    () => () =>
      near.promise
        .then(() => import("@/components/motion/features-max"))
        .then((mod) => {
          ref.current?.setAttribute("data-motion-max", "ready");
          return mod.default;
        }),
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.resolve();
        io.disconnect();
      },
      { rootMargin: "25% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  return (
    <div ref={ref} className={className}>
      <LazyMotion features={loadFeatures}>{children}</LazyMotion>
    </div>
  );
}
