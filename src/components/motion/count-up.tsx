"use client";

import { cubicBezier, inView } from "motion";
import { useLocale } from "next-intl";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { EASE_OUT_EXPO } from "@/components/motion/tokens";
import { useMotionMode } from "@/components/motion/use-motion-prefs";

export type CountUpProps = {
  to: number;
  from?: number;
  /** Seconds. */
  duration?: number;
  decimals?: number;
  className?: string;
  /** Called with the current (unrounded) value on every frame, and once with `to` in reduced motion. */
  onUpdate?: (value: number) => void;
};

const ease = cubicBezier(...EASE_OUT_EXPO);

/**
 * Counts from `from` to `to` once 60% of it is in view (desktop and touch alike), with the
 * global expo-out easing. Reduced motion: shows the final number straight away.
 * Screen readers always read the final number; width is reserved so nothing shifts.
 */
export function CountUp({ to, from = 0, duration = 1.6, decimals = 0, className, onUpdate }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  const mode = useMotionMode();
  const locale = useLocale();
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [locale, decimals],
  );
  const final = formatter.format(to);
  const report = useEffectEvent((v: number) => onUpdate?.(v));

  // Once in view (60%), start counting. Stops observing after the first time.
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const stop = inView(
      el,
      () => {
        setSeen(true);
        queueMicrotask(() => stop());
      },
      { amount: 0.6 },
    );
    return () => stop();
  }, [seen]);

  useEffect(() => {
    const el = ref.current;
    if (!el || mode === "ssr") return;
    if (mode === "reduced") {
      el.textContent = final;
      report(to);
      return;
    }
    if (!seen) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const v = from + (to - from) * ease(t);
      el.textContent = formatter.format(v);
      report(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, mode, from, to, duration, final, formatter]);

  return (
    <span className={cn("tabular inline-block text-start", className)} style={{ minWidth: `${final.length}ch` }}>
      <span className="sr-only">{final}</span>
      <span ref={ref} aria-hidden>
        {formatter.format(from)}
      </span>
    </span>
  );
}
