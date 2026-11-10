"use client";

import { useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import Image, { type ImageProps } from "next/image";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMotionMode } from "@/components/motion/use-motion-prefs";

type FrameProps = {
  /** Frame classes. Give the frame a size or aspect ratio. */
  className?: string;
  /** Drift in percent of the frame height, each way. */
  amount?: number;
};

type WithImage = Omit<ImageProps, "fill" | "width" | "height" | "className"> & {
  imageClassName?: string;
  children?: undefined;
};

/** Any content instead of a photo (e.g. a placeholder until the real photo exists). It fills the layer and drifts like a photo. */
type WithContent = { children: ReactNode; src?: undefined; imageClassName?: undefined };

export type ParallaxImageProps = FrameProps & (WithImage | WithContent);

/**
 * The image drifts ±6% inside its frame as the frame scrolls through the viewport
 * (transform only, reacts to native scroll). Works on desktop and touch.
 * Reduced motion: the image stays still.
 */
export function ParallaxImage({ className, amount = 6, ...media }: ParallaxImageProps) {
  const frame = useRef<HTMLDivElement>(null);
  const mode = useMotionMode();
  const { scrollYProgress } = useScroll({ target: frame, offset: ["start end", "end start"] });
  // The layer is (100 + 2 × amount)% of the frame's height, and a translate percentage refers
  // to the layer itself. Converting keeps the drift at exactly ±amount% of the frame, which is
  // the overhang on each side, so no edge can ever show.
  const drift = (amount / (100 + 2 * amount)) * 100;
  const y = useTransform(scrollYProgress, [0, 1], [`-${drift}%`, `${drift}%`]);
  const still = mode === "reduced" || mode === "ssr";

  let content: ReactNode;
  if (media.src === undefined) {
    content = media.children;
  } else {
    const { imageClassName, alt, sizes = "100vw", ...imageProps } = media;
    content = <Image fill alt={alt} sizes={sizes} className={cn("object-cover", imageClassName)} {...imageProps} />;
  }

  return (
    <div ref={frame} className={cn("relative overflow-hidden", className)}>
      {/* Taller than the frame by 2× the drift so edges never show. */}
      <m.div className="absolute inset-x-0" style={{ top: `-${amount}%`, bottom: `-${amount}%`, y: still ? 0 : y }}>
        {content}
      </m.div>
    </div>
  );
}
