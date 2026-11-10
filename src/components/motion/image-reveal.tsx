"use client";

import { animate } from "motion/mini";
import Image, { type ImageProps } from "next/image";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT_EXPO } from "@/components/motion/tokens";
import { useInViewReveal } from "@/components/motion/use-in-view-reveal";

type FrameProps = {
  /** Frame classes. Give the frame a size or aspect ratio, e.g. "aspect-[4/5]". */
  className?: string;
  duration?: number;
  delay?: number;
  amount?: number;
};

type WithImage = Omit<ImageProps, "fill" | "width" | "height" | "className"> & {
  imageClassName?: string;
  children?: undefined;
};

/** Any content instead of a photo (e.g. a placeholder until the real photo exists). It fills the frame. */
type WithContent = { children: ReactNode; src?: undefined };

export type ImageRevealProps = FrameProps & (WithImage | WithContent);

const OPEN = "inset(0% 0% 0% 0%)";

/**
 * The frame wipes open from the bottom (clip-path inset 100% → 0) while the image settles
 * from scale 1.2 to 1. Same on desktop and touch. Reduced motion: a short fade.
 * Visible in the server HTML and without JavaScript.
 */
export function ImageReveal({ className, duration = 1.1, delay = 0, amount = 0.3, ...media }: ImageRevealProps) {
  // The frame is what's observed; the clipped layer sits inside it (a fully clipped element
  // has no visible area, so it could never be detected entering the screen).
  const frame = useRef<HTMLDivElement>(null);
  const clip = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useInViewReveal(
    frame,
    (_, mode) => {
      const el = clip.current;
      if (!el) return;
      if (mode === "reduced") {
        el.style.opacity = "0";
        el.style.clipPath = OPEN;
        const c = animate(el, { opacity: [0, 1] }, { duration: DURATION.reducedFade, ease: "linear" });
        return () => c.stop();
      }
      // Browser-native animations (motion/mini): same keyframes, timing and easing as before.
      const t = { duration, delay, ease: EASE_OUT_EXPO };
      const a = animate(el, { clipPath: ["inset(100% 0% 0% 0%)", OPEN] }, t);
      const b = inner.current ? animate(inner.current, { transform: ["scale(1.2)", "none"] }, t) : null;
      return () => {
        a.stop();
        b?.stop();
      };
    },
    { amount },
  );

  return (
    <div ref={frame} className={cn("relative overflow-hidden", className)}>
      <div ref={clip} data-reveal="clip" className="absolute inset-0 overflow-hidden">
        <div ref={inner} className="absolute inset-0">
          {media.src === undefined ? media.children : <FrameImage {...media} />}
        </div>
      </div>
    </div>
  );
}

function FrameImage({ imageClassName, alt, sizes = "100vw", ...imageProps }: WithImage) {
  return <Image fill alt={alt} sizes={sizes} className={cn("object-cover", imageClassName)} {...imageProps} />;
}
