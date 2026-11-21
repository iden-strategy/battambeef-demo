"use client";

import { ArrowRight, Pause, Play } from "lucide-react";
import type { getImageProps } from "next/image";
import { useEffect, useRef, useState, type FocusEvent, type PointerEvent } from "react";
import { useMotionMode } from "@/components/motion/use-motion-prefs";
import { Link } from "@/i18n/navigation";

/** Time each steak stays on screen while the slider rotates (the crossfade is 0.9 s, in CSS). */
const ROTATE_MS = 4000;

export type HeroSlideView = {
  id: string;
  img: ReturnType<typeof getImageProps>["props"];
  imgLang?: string;
  name: string;
  nameLang?: string;
  href: string;
  linkLabel: string;
  linkLang?: string;
  dotLabel: string;
  dotLang?: string;
  groupLabel: string;
};

type Labels = {
  region: string;
  pause: string;
  pauseLang?: string;
  play: string;
  playLang?: string;
  seeCut: string;
  seeCutLang?: string;
};

/**
 * The hero's steak slider (WAI-ARIA carousel pattern). Everything is server-rendered; this only
 * adds the rotation and the controls.
 *
 * - Crossfade every 4 s (CSS opacity transition): only the steak and its caption change, inside a
 *   fixed box, so nothing shifts.
 * - Rotation pauses while the mouse is over the steak box, the caption or the controls, while
 *   keyboard focus is inside (a mouse click never pauses it), while the tab is hidden, and with
 *   the pause button. Play clears every pause except hover. With reduced motion it never rotates
 *   (and the button is hidden).
 * - Screen readers: a labelled carousel region; aria-live is "off" while rotating and "polite"
 *   otherwise, so only a slide the user picks is announced.
 * - Only the first image is in the page's HTML (the LCP image). The others are mounted once the
 *   page has loaded and the browser is idle, or at once when their dot is picked. Rotation only
 *   moves on to an image that has loaded, and skips one that failed. A picked slide whose image is
 *   still loading is shown once it has loaded; until then the current steak stays.
 * - Only the caption and the controls catch the pointer (pointer-events in globals.css): the
 *   steak never covers a link or a button. Steak hover is a position check against the steak box.
 */
export function HeroSlider({ slides, labels }: { slides: HeroSlideView[]; labels: Labels }) {
  const mode = useMotionMode();
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [hoverUi, setHoverUi] = useState(false);
  const [hoverSteak, setHoverSteak] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [mountAll, setMountAll] = useState(false);
  const [loaded, setLoaded] = useState(() => slides.map((_, i) => i === 0));
  const [failed, setFailed] = useState(() => slides.map(() => false));
  const rootRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const firstImgRef = useRef<HTMLImageElement>(null);

  const canRotate = mode === "fine" || mode === "touch";
  const rotating = canRotate && !paused && !hoverUi && !hoverSteak && !focused && !tabHidden;

  // The next slide in order whose image has not failed (the current one if all others failed).
  let next = index;
  for (let step = 1; step < slides.length; step++) {
    const j = (index + step) % slides.length;
    if (!failed[j]) {
      next = j;
      break;
    }
  }

  // A picked slide that was still loading is shown once its image has loaded (or dropped if it
  // failed). React always calls the latest handler, so `pending` here is current.
  const onImgLoad = (i: number) => {
    setLoaded((l) => (l[i] ? l : l.map((v, j) => v || j === i)));
    if (pending === i) {
      setIndex(i);
      setPending(null);
    }
  };
  const markFailed = (i: number) => {
    setFailed((f) => (f[i] ? f : f.map((v, j) => v || j === i)));
    if (pending === i) setPending(null);
  };

  // Mount the other images once the page has settled (load event, then an idle moment).
  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const go = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(() => setMountAll(true), { timeout: 2000 });
      else timer = window.setTimeout(() => setMountAll(true), 200);
    };
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => {
      window.removeEventListener("load", go);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  // The first image is server-rendered: it may have failed before React attached onError.
  useEffect(() => {
    const img = firstImgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed((f) => f.map((v, j) => v || j === 0));
  }, []);

  // Hidden tab: no rotation. Hover can never get stuck: leaving the window, switching tabs or
  // moving the mouse out of the page clears it.
  useEffect(() => {
    const clearHover = () => {
      setHoverUi(false);
      setHoverSteak(false);
    };
    const onVisibility = () => {
      setTabHidden(document.hidden);
      clearHover();
    };
    const html = document.documentElement;
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", clearHover);
    html.addEventListener("mouseleave", clearHover);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", clearHover);
      html.removeEventListener("mouseleave", clearHover);
    };
  }, []);

  // Steak hover (fine pointers only): the pointer position checked against the steak box. The box
  // is read at most once per frame, and only after a scroll or resize (it does not move with the
  // pointer depth effect: only the steak inside it does).
  useEffect(() => {
    if (mode !== "fine") return;
    const frame = frameRef.current;
    if (!frame) return;
    let rect: DOMRect | null = null;
    let pos: { x: number; y: number } | null = null;
    let raf = 0;
    const check = () => {
      raf = 0;
      if (!pos) return setHoverSteak(false);
      rect ??= frame.getBoundingClientRect();
      setHoverSteak(pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    const onMove = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pos = { x: e.clientX, y: e.clientY };
      schedule();
    };
    const onLayout = () => {
      rect = null;
      if (pos) schedule();
    };
    const forget = () => {
      pos = null;
    };
    const html = document.documentElement;
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onLayout, { passive: true });
    window.addEventListener("resize", onLayout);
    window.addEventListener("blur", forget);
    document.addEventListener("visibilitychange", forget);
    html.addEventListener("mouseleave", forget);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onLayout);
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("blur", forget);
      document.removeEventListener("visibilitychange", forget);
      html.removeEventListener("mouseleave", forget);
      setHoverSteak(false);
    };
  }, [mode]);

  // One timer per slide: re-armed whenever the slide or the pause state changes.
  useEffect(() => {
    if (!rotating || pending !== null || next === index || !loaded[next]) return;
    const id = window.setTimeout(() => setIndex(next), ROTATE_MS);
    return () => window.clearTimeout(id);
  }, [rotating, pending, next, index, loaded]);

  const show = (i: number) => {
    setMountAll(true);
    if (failed[i]) return;
    if (loaded[i]) {
      setPending(null);
      setIndex(i);
    } else {
      setPending(i);
    }
  };

  const toggle = () => {
    if (paused) {
      // Play clears every pause except hover (the mouse is over the button right now).
      setPaused(false);
      setFocused(false);
    } else {
      setPaused(true);
    }
  };

  const onUiEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setHoverUi(true);
  };
  const onUiLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setHoverUi(false);
  };
  // Only keyboard focus pauses: a mouse click on a dot or the button must not.
  const onFocus = (e: FocusEvent) => setFocused(e.target.matches(":focus-visible"));
  const onBlur = (e: FocusEvent) => {
    if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label={labels.region}
      className="hero-slider"
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className="hero-slides" aria-live={rotating ? "off" : "polite"} data-hero-slides="">
        {/* The spotlight glow and the floor shadow: the same for every slide. */}
        <div ref={frameRef} aria-hidden className="hero-steak-frame" />
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={slide.groupLabel}
              aria-hidden={!active}
              inert={!active}
              data-active={active ? "true" : "false"}
              data-slide={slide.id}
              className="hero-slide"
            >
              <div className="hero-steak" data-depth="scene">
                <div className="hero-steak-settle">
                  {(i === 0 || mountAll) && (
                    // A plain <img> with next/image's optimised props (getImageProps on the server).
                    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element -- alt comes from getImageProps
                    <img
                      {...slide.img}
                      ref={i === 0 ? firstImgRef : undefined}
                      lang={slide.imgLang}
                      className="hero-steak-img"
                      onLoad={i === 0 ? undefined : () => onImgLoad(i)}
                      onError={() => markFailed(i)}
                    />
                  )}
                </div>
              </div>
              <p className="hero-steak-caption" onPointerEnter={onUiEnter} onPointerLeave={onUiLeave}>
                <span className="hero-steak-name title-md" lang={slide.nameLang}>
                  {slide.name}
                </span>
                {/* The name starts with the visible text ("See this cut: Ribeye Steak"). */}
                <Link href={slide.href} aria-label={slide.linkLabel} lang={slide.linkLang} className="hero-steak-link">
                  <span lang={labels.seeCutLang}>{labels.seeCut}</span>
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </p>
            </div>
          );
        })}
      </div>

      <div className="hero-slider-controls" onPointerEnter={onUiEnter} onPointerLeave={onUiLeave}>
        <button
          type="button"
          className="hero-slider-toggle"
          aria-label={paused ? labels.play : labels.pause}
          lang={paused ? labels.playLang : labels.pauseLang}
          onClick={toggle}
        >
          {paused ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
        </button>
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            className="hero-slider-dot"
            aria-label={slide.dotLabel}
            lang={slide.dotLang}
            aria-current={i === index ? "true" : undefined}
            disabled={failed[i]}
            onClick={() => show(i)}
          />
        ))}
      </div>
    </section>
  );
}
