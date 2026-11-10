"use client";

import { animate, useMotionValue, type PanInfo } from "motion/react";
import * as m from "motion/react-m";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { cursorTarget } from "@/components/motion/cursor-target";
import { MotionMaxProvider } from "@/components/motion/motion-max-provider";
import { reducedTransition, SPRING_UI } from "@/components/motion/tokens";
import { useMotionMode } from "@/components/motion/use-motion-prefs";
import { useFallbackLang } from "@/i18n/use-fallback-lang";

export type DragCarouselProps = {
  /** One child per slide. */
  children: ReactNode;
  /** Accessible name of the carousel. */
  label?: string;
  className?: string;
  slideClassName?: string;
  initialIndex?: number;
  /** Called when the active slide changes. */
  onIndexChange?: (index: number) => void;
};

const SPRING = { ...SPRING_UI, damping: 34 };

/**
 * Horizontal carousel with drag/swipe momentum and snap. The active slide is full size,
 * neighbours scale to 0.88 and dim. Arrow buttons, ←/→/Home/End keys when focused, and touch
 * swipes all work. Vertical page scrolling is never blocked (touch-action: pan-y).
 * Reduced motion: slides jump instead of gliding.
 * Drag needs Motion's larger feature set: MotionMaxProvider loads it as the carousel nears the
 * screen, so it is never part of the page's start-up JavaScript. Arrows and keys work before that.
 */
export function DragCarousel({
  children,
  label,
  className,
  slideClassName,
  initialIndex = 0,
  onIndexChange,
}: DragCarouselProps) {
  const t = useTranslations("kit");
  const lang = useFallbackLang();
  const slides = Children.toArray(children);
  const count = slides.length;
  const mode = useMotionMode();
  const reduced = mode === "reduced";

  const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), count - 1));
  const [step, setStep] = useState(0);
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const first = track?.children[0] as HTMLElement | undefined;
    if (!track || !first) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return first.offsetWidth + gap;
  }, []);

  const goTo = useCallback(
    (next: number, instant = false) => {
      const clamped = Math.min(Math.max(next, 0), count - 1);
      setIndex(clamped);
      onIndexChange?.(clamped);
      const s = measure();
      animate(x, -clamped * s, instant || reduced ? { duration: 0 } : SPRING);
    },
    [count, measure, onIndexChange, reduced, x],
  );

  const indexRef = useRef(index);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Keep the active slide centred when the width changes.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver(() => {
      const s = measure();
      setStep(s);
      x.jump(-indexRef.current * s);
    });
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure, x]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // The click that follows a drag is swallowed in onClickCapture; clear the flag after it.
    setTimeout(() => (dragged.current = false), 0);
    const s = step || measure();
    if (!s) return;
    const projected = x.get() + info.velocity.x * 0.2;
    let next = Math.round(-projected / s);
    // A quick flick always moves at least one slide.
    if (next === index && Math.abs(info.velocity.x) > 400) next += info.velocity.x < 0 ? 1 : -1;
    goTo(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: count - 1 };
    if (e.key in keys) {
      e.preventDefault();
      goTo(keys[e.key]);
    }
  };

  return (
    <MotionMaxProvider className={cn("@container", className)}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={label ?? t("carouselLabel")}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="overflow-x-clip rounded-2xl py-6 [--slide-w:80cqw] @xl:[--slide-w:56cqw] @4xl:[--slide-w:38cqw] @7xl:[--slide-w:30cqw]"
        {...cursorTarget("drag")}
      >
        <m.div
          ref={trackRef}
          className="flex cursor-grab touch-pan-y gap-4 ps-[calc((100cqw-var(--slide-w))/2)] pe-[calc((100cqw-var(--slide-w))/2)] select-none active:cursor-grabbing md:gap-6 @4xl:ps-[calc(max(0px,(100cqw-var(--container-max))/2)+var(--gutter))]"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: -(count - 1) * step, right: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => (dragged.current = true)}
          onDragEnd={onDragEnd}
        >
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <m.div
                key={i}
                role="group"
                aria-roledescription={t("slide")}
                aria-label={t("slideOf", { current: i + 1, total: count })}
                className={cn("w-[var(--slide-w)] shrink-0", slideClassName)}
                initial={false}
                animate={{ scale: active ? 1 : 0.88, opacity: active ? 1 : 0.45 }}
                transition={reduced ? { scale: { duration: 0 }, opacity: reducedTransition } : SPRING}
                // Keyboard: when Tab moves focus into another slide, bring that slide to the centre.
                // Keyboard focus only: a mouse press also focuses a button, and moving the slide
                // then would let the click through (it should only bring the side card in).
                onFocusCapture={(e) => {
                  if (i !== indexRef.current && (e.target as HTMLElement).matches(":focus-visible")) goTo(i);
                }}
                onClickCapture={(e) => {
                  if (dragged.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  if (!active) {
                    e.preventDefault();
                    goTo(i);
                  }
                }}
              >
                {slide}
              </m.div>
            );
          })}
        </m.div>
      </div>

      <div className="container-page mt-2 flex items-center justify-between gap-4">
        <p className="label tabular text-muted-foreground" aria-hidden>
          {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
        </p>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {t("slideOf", { current: index + 1, total: count })}
        </p>
        <div className="flex gap-2">
          <CarouselArrow
            label={t("carouselPrev")}
            lang={lang("kit.carouselPrev")}
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeft aria-hidden className="size-5" />
          </CarouselArrow>
          <CarouselArrow
            label={t("carouselNext")}
            lang={lang("kit.carouselNext")}
            disabled={index === count - 1}
            onClick={() => goTo(index + 1)}
          >
            <ChevronRight aria-hidden className="size-5" />
          </CarouselArrow>
        </div>
      </div>
    </MotionMaxProvider>
  );
}

function CarouselArrow({
  label,
  lang,
  disabled,
  onClick,
  children,
}: {
  label: string;
  lang?: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      lang={lang}
      className="inline-flex size-11 items-center justify-center rounded-full border-[1.5px] border-current/55 text-foreground transition-[opacity,transform] duration-150 active:scale-95 disabled:opacity-35 [@media(hover:hover)]:hover:border-current [@media(hover:hover)]:hover:bg-foreground/10"
    >
      {children}
    </button>
  );
}
