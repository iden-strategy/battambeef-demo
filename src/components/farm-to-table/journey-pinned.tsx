"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { PAGE_SETTLED_EVENT } from "@/components/motion/page-transition";

// GSAP + ScrollTrigger: this file only, loaded by JourneyScroller only while the desktop journey
// is shown (≥1024px, motion allowed). Phones never download it (CLAUDE.md section 3).
gsap.registerPlugin(useGSAP, ScrollTrigger);

const CLOSED = "inset(100% 0% 0% 0%)";
const OPEN = "inset(0% 0% 0% 0%)";
/** Half the length of a stage change, in timeline units (one unit = one stage). */
const HALF = 0.25;

/**
 * The desktop journey's scroll animation. Renders only a hidden marker; drives the
 * server-rendered markup of its parent (JourneyScroller's root).
 * The stage is held by CSS `position: sticky` inside a 500svh track; ScrollTrigger only reads the
 * scroll position (scrub) and plays the rail fill, photo wipes and text changes. Native scrolling,
 * no snapping. Everything lives in useGSAP's context, so it is reverted when this unmounts (route
 * change, page hidden, or the screen switching to the stacked version). No duplicate triggers.
 */
export function JourneyPinned() {
  // The journey root is found from this component's own marker element, not from a parent ref:
  // when a hidden page is shown again (React Activity), refs are re-attached child-first, so a
  // parent's ref is still null when this setup runs. Our own ref is always attached by then.
  const marker = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      const el = marker.current?.parentElement;
      if (!el) return;
      ScrollTrigger.config({ ignoreMobileResize: true });
      const cleanup = setupPinned(el);

      // Test hook, only when an e2e test sets window.__BB_E2E__ before the page loads (never for
      // visitors): how many ScrollTriggers exist now (only this page uses them), to prove that
      // leaving and coming back never leaves duplicates behind.
      if ((window as { __BB_E2E__?: boolean }).__BB_E2E__) {
        el.dataset.scrollTriggers = String(ScrollTrigger.getAll().length);
      }

      // Re-measure once web fonts, images and the incoming page transition have settled.
      let live = true;
      let frame = 0;
      const refresh = () => {
        if (!live) return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => ScrollTrigger.refresh());
      };
      document.fonts?.ready.then(refresh);
      el.addEventListener("load", refresh, true); // image loads (capture: load does not bubble)
      window.addEventListener(PAGE_SETTLED_EVENT, refresh);

      return () => {
        live = false;
        cancelAnimationFrame(frame);
        el.removeEventListener("load", refresh, true);
        window.removeEventListener(PAGE_SETTLED_EVENT, refresh);
        cleanup?.();
        delete el.dataset.scrollTriggers;
      };
    },
    { scope: marker },
  );
  return <span ref={marker} hidden />;
}

function all<T extends Element = HTMLElement>(scope: Element, selector: string) {
  return Array.from(scope.querySelectorAll<T>(selector));
}

/** Sticky stage, scroll-scrubbed timeline. One timeline unit per stage. */
function setupPinned(el: HTMLElement) {
  const track = el.querySelector<HTMLElement>('[data-journey="desktop"]');
  if (!track) return;
  const layers = all(track, "[data-layer]");
  const inners = all(track, "[data-layer-inner]");
  const panels = all(track, "[data-panel]");
  const steps = all<HTMLButtonElement>(track, "[data-rail-step]");
  const fill = track.querySelector("[data-rail-fill]");
  const n = layers.length;
  if (n === 0) return;

  let active = -1;
  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    steps.forEach((s, j) => {
      s.dataset.state = j < i ? "done" : j === i ? "active" : "todo";
      if (j === i) s.setAttribute("aria-current", "step");
      else s.removeAttribute("aria-current");
    });
    // Screen readers get only the stage on screen; the others are faded out or covered.
    // (The server HTML starts the same way: everything but stage 1 aria-hidden.)
    [panels, layers].forEach((list) =>
      list.forEach((p, j) => {
        if (j === i) p.removeAttribute("aria-hidden");
        else p.setAttribute("aria-hidden", "true");
      }),
    );
  };
  setActive(0);

  gsap.set(layers.slice(1), { clipPath: CLOSED });
  gsap.set(inners.slice(1), { scale: 1.15 });
  gsap.set(panels.slice(1), { opacity: 0, y: 40 });

  const tl: gsap.core.Timeline = gsap.timeline({
    defaults: { ease: "none" },
    // The active stage follows the (smoothed) timeline, so it changes exactly mid-wipe.
    onUpdate: () => setActive(Math.min(n - 1, Math.floor(tl.progress() * n))),
    scrollTrigger: {
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5, // visual smoothing only; the scroll itself is untouched
    },
  });

  // The rail fills from the first dot to the last, reaching dot i as stage i becomes active.
  if (fill) tl.fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: n - 1 }, 0);

  for (let i = 1; i < n; i++) {
    const at = i - HALF;
    const len = HALF * 2;
    tl.fromTo(layers[i], { clipPath: CLOSED }, { clipPath: OPEN, duration: len, ease: "power2.inOut" }, at)
      .fromTo(inners[i], { scale: 1.15 }, { scale: 1, duration: len, ease: "power2.out" }, at)
      .to(panels[i - 1], { opacity: 0, y: -32, duration: len * 0.45, ease: "power2.in" }, at)
      .fromTo(panels[i], { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: len * 0.55, ease: "power3.out" }, at + len * 0.45);
  }
  tl.set({}, {}, n); // pad to n units: the last stage holds before the section scrolls on

  // Rail buttons jump to a stage (keyboard and pointer); the browser's own smooth scroll.
  const st = tl.scrollTrigger;
  const onClick = (e: MouseEvent) => {
    const step = (e.target as Element).closest<HTMLElement>("[data-rail-step]");
    if (!step || !st) return;
    const i = Number(step.dataset.railStep);
    const t = i === 0 ? 0 : i + HALF + 0.05;
    window.scrollTo({ top: st.start + (st.end - st.start) * (t / n), behavior: "smooth" });
  };
  track.addEventListener("click", onClick);
  // Tells JourneyScroller the animation is running (otherwise it falls back to the stacked version).
  track.dataset.pinned = "";

  return () => {
    track.removeEventListener("click", onClick);
    delete track.dataset.pinned;
    setActive(0);
  };
}
