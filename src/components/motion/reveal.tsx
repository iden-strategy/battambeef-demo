"use client";

import { animate } from "motion/mini";
import { useRef, type CSSProperties, type ReactNode } from "react";
import { staggerDelay } from "@/components/motion/stagger";
import { DURATION, EASE_OUT_EXPO } from "@/components/motion/tokens";
import { useInViewReveal } from "@/components/motion/use-in-view-reveal";
import { cn } from "@/lib/utils";

type Tag = "div" | "section" | "ul" | "ol" | "li" | "p" | "span" | "article" | "header";

export type RevealProps = {
  children: ReactNode;
  as?: Tag;
  className?: string;
  /** Distance in px to rise from. */
  y?: number;
  delay?: number;
  duration?: number;
  /** Fraction of the element that must be visible before it plays. */
  amount?: number;
  /** Seconds between direct RevealItem children. 0 = reveal as one block. */
  stagger?: number;
  /**
   * "inView" (default) plays when scrolled into view (Motion, after hydration).
   * "mount" plays from the first paint with CSS, for content at the top of a page: it never
   * waits for JavaScript. `stagger` is ignored in mount mode.
   */
  trigger?: "inView" | "mount";
};

/**
 * Fade-up (24px) when 25% in view, once.
 * Wrap children in <RevealItem> and set `stagger` to reveal them one after another.
 * Reduced motion: a short fade without movement.
 * Visible in the server HTML and without JavaScript.
 */
export function Reveal({
  children,
  as = "div",
  className,
  y = 24,
  delay = 0,
  duration = DURATION.reveal,
  amount = 0.25,
  stagger = 0,
  trigger = "inView",
}: RevealProps) {
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement>(null);
  const mount = trigger === "mount";

  useInViewReveal(
    ref,
    (el, mode) => {
      const targets = stagger ? Array.from(el.querySelectorAll<HTMLElement>(":scope > [data-reveal-item]")) : [el];
      if (targets.length === 0) return;
      const reduced = mode === "reduced";
      // Browser-native animations (motion/mini): same keyframes, timing and easing as before.
      const controls = animate(
        targets,
        reduced ? { opacity: [0, 1] } : { opacity: [0, 1], transform: [`translateY(${y}px)`, "none"] },
        {
          duration: reduced ? DURATION.reducedFade : duration,
          ease: reduced ? "linear" : EASE_OUT_EXPO,
          delay: stagger ? staggerDelay(reduced ? 0 : stagger, delay) : reduced ? 0 : delay,
        },
      );
      return () => controls.stop();
    },
    { amount, enabled: !mount },
  );

  if (mount) {
    const style = {
      "--reveal-y": `${y}px`,
      "--reveal-delay": `${delay}s`,
      "--reveal-dur": `${duration}s`,
    } as CSSProperties;
    return (
      <Tag className={cn("reveal-mount", className)} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal={stagger ? undefined : "fade"}
      data-reveal-group={stagger ? "" : undefined}
    >
      {children}
    </Tag>
  );
}

export type RevealItemProps = {
  children: ReactNode;
  as?: Tag;
  className?: string;
};

/** A child of <Reveal stagger={…}>; revealed in turn by its parent. */
export function RevealItem({ children, as = "div", className }: RevealItemProps) {
  const Tag = as as "div";
  return (
    <Tag className={className} data-reveal-item="">
      {children}
    </Tag>
  );
}
