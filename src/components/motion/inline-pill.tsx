"use client";

import { animate } from "motion/react";
import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT_EXPO } from "@/components/motion/tokens";
import { useInViewReveal } from "@/components/motion/use-in-view-reveal";

export type InlinePillProps = {
  /** The photo. Leave it out and pass `children` for a placeholder (e.g. an icon on a fill). */
  src?: string;
  /** Empty by default: the pill is decorative inside a sentence. */
  alt?: string;
  className?: string;
  /** Pill width in em (height is always 0.85em). */
  widthEm?: number;
  delay?: number;
  objectPosition?: string;
  /** Placeholder content, shown centred instead of a photo. Zooms in like a photo does. */
  children?: ReactNode;
};

/**
 * A rounded photo inside a line of text (0.85em tall). Springs in from scale 0 with a little
 * overshoot while the photo zooms 1.5 → 1. Same on desktop and touch. Reduced motion: fade.
 * Visible in the server HTML and without JavaScript.
 */
export function InlinePill({
  src,
  alt = "",
  className,
  widthEm = 1.9,
  delay = 0,
  objectPosition = "center",
  children,
}: InlinePillProps) {
  // The slot is what's observed (a scale(0) element has no area to detect); the pill inside it
  // springs open.
  const slot = useRef<HTMLSpanElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const photo = useRef<HTMLSpanElement>(null);

  useInViewReveal(
    slot,
    (_, mode) => {
      const el = pill.current;
      if (!el) return;
      if (mode === "reduced") {
        el.style.opacity = "0";
        el.style.transform = "none";
        const c = animate(el, { opacity: [0, 1] }, { duration: DURATION.reducedFade, ease: "linear" });
        return () => c.stop();
      }
      const a = animate(el, { scale: [0, 1] }, { type: "spring", stiffness: 320, damping: 16, delay });
      const b = photo.current ? animate(photo.current, { scale: [1.5, 1] }, { duration: 1, delay, ease: EASE_OUT_EXPO }) : null;
      return () => {
        a.stop();
        b?.stop();
      };
    },
    { amount: 0.8 },
  );

  return (
    <span
      ref={slot}
      className={cn("relative mx-[0.12em] inline-block align-[-0.06em]", className)}
      style={{ height: "0.85em", width: `${widthEm}em` }}
    >
      <span ref={pill} data-reveal="pop" className="absolute inset-0 block overflow-hidden rounded-full bg-card">
        <span ref={photo} className="absolute inset-0 flex items-center justify-center">
          {src ? <Image src={src} alt={alt} fill sizes="160px" className="object-cover" style={{ objectPosition }} /> : children}
        </span>
      </span>
    </span>
  );
}
