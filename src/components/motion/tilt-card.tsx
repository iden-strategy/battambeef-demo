"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMotionMode } from "@/components/motion/use-motion-prefs";
import { usePointerEffect } from "@/components/motion/use-pointer-effect";

export type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Maximum tilt in degrees. */
  maxTilt?: number;
  /** Show the soft light sheen that follows the cursor. */
  sheen?: boolean;
};

/**
 * Desktop (fine pointer): tilts up to 4° toward the cursor with a soft sheen of light.
 * Touch and reduced motion: a flat, still card, and the effect's code is never downloaded
 * (pointer-effects.ts).
 */
export function TiltCard({ children, className, maxTilt = 4, sheen = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLSpanElement>(null);
  const active = useMotionMode() === "fine";
  usePointerEffect((fx) => (ref.current ? fx.attachTilt(ref.current, sheenRef.current, maxTilt) : undefined), [maxTilt, sheen]);

  return (
    <div ref={ref} className={cn("relative isolate overflow-hidden", className)}>
      {children}
      {active && sheen && (
        <span
          ref={sheenRef}
          aria-hidden
          className="pointer-events-none absolute -inset-1/4 z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28),transparent_45%)] opacity-0"
        />
      )}
    </div>
  );
}
