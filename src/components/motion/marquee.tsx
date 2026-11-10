"use client";

import { useAnimationFrame, useInView, useMotionValue, useSpring } from "motion/react";
import * as m from "motion/react-m";
import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMotionMode } from "@/components/motion/use-motion-prefs";

export type MarqueeProps = {
  items: string[];
  /** Pixels per second. */
  speed?: number;
  /** Speed multiplier while hovered (desktop). */
  hoverSpeed?: number;
  direction?: "left" | "right";
  className?: string;
  itemClassName?: string;
  separator?: ReactNode;
};

/**
 * An endless horizontal strip. Slows down on hover (desktop), pauses while off-screen.
 * Touch: same strip, no hover slow-down. Reduced motion: a still row.
 * Screen readers get the items once as plain text.
 */
export function Marquee({
  items,
  speed = 60,
  hoverSpeed = 0.2,
  direction = "left",
  className,
  itemClassName,
  separator = <span aria-hidden className="mx-[0.6em] inline-block size-[0.22em] rounded-full bg-current align-middle opacity-60" />,
}: MarqueeProps) {
  const mode = useMotionMode();
  const still = mode === "reduced" || mode === "ssr";
  const root = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const inView = useInView(root);
  const [copyWidth, setCopyWidth] = useState(0);
  const [copies, setCopies] = useState(2);
  const x = useMotionValue(0);
  const factor = useSpring(1, { stiffness: 120, damping: 20 });

  useLayoutEffect(() => {
    const ro = new ResizeObserver(() => {
      const w = copy.current?.offsetWidth ?? 0;
      const container = root.current?.offsetWidth ?? 0;
      setCopyWidth(w);
      if (w > 0) setCopies(Math.max(2, Math.ceil(container / w) + 1));
    });
    if (root.current) ro.observe(root.current);
    if (copy.current) ro.observe(copy.current);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (still || !inView || copyWidth === 0) return;
    const dir = direction === "left" ? -1 : 1;
    let next = x.get() + dir * speed * factor.get() * (Math.min(delta, 64) / 1000);
    // Wrap within one copy's width for a seamless loop.
    if (next <= -copyWidth) next += copyWidth;
    if (next > 0) next -= copyWidth;
    x.set(next);
  });

  const row = items.map((item, i) => (
    <Fragment key={i}>
      <span className={cn("whitespace-nowrap", itemClassName)}>{item}</span>
      {separator}
    </Fragment>
  ));

  return (
    <div
      ref={root}
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={(e) => mode === "fine" && e.pointerType === "mouse" && factor.set(hoverSpeed)}
      onPointerLeave={() => factor.set(1)}
    >
      <p className="sr-only">{items.join(" · ")}</p>
      <m.div aria-hidden className="flex w-max" style={{ x: still ? 0 : x }}>
        {Array.from({ length: copies }, (_, i) => (
          <div key={i} ref={i === 0 ? copy : undefined} className="flex shrink-0 items-center">
            {row}
          </div>
        ))}
      </m.div>
    </div>
  );
}
