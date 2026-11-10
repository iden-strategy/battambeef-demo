"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePointerEffect } from "@/components/motion/use-pointer-effect";

export type MagneticButtonProps = {
  /** The button or link to make magnetic. */
  children: ReactNode;
  className?: string;
  /** Maximum pull toward the cursor, in px. */
  strength?: number;
};

/**
 * Wrap a button or link: on desktop (fine pointer) it moves up to 8px toward the cursor and
 * springs back on leave. Touch and reduced motion: a normal, still button, and the effect's
 * code is never downloaded (pointer-effects.ts).
 */
export function MagneticButton({ children, className, strength = 8 }: MagneticButtonProps) {
  const ref = useRef<HTMLSpanElement>(null);
  usePointerEffect((fx) => (ref.current ? fx.attachMagnetic(ref.current, strength) : undefined), [strength]);

  return (
    <span ref={ref} className={cn("inline-flex", className)}>
      {children}
    </span>
  );
}
