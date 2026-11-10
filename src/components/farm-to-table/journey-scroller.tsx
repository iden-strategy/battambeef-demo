"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { JourneyVersionContext, type JourneyVersion } from "@/components/farm-to-table/journey-version";
import { useMediaQuery } from "@/components/motion/use-media-query";
import { useMotionMode } from "@/components/motion/use-motion-prefs";

// The desktop scroll animation (GSAP + ScrollTrigger) is a separate chunk, downloaded only when
// the desktop journey is shown. Phones never load GSAP. If the chunk fails to load, the journey
// falls back to the stacked version instead of reaching the page's error boundary.
const JourneyPinned = dynamic(
  () =>
    import("@/components/farm-to-table/journey-pinned")
      .then((m) => m.JourneyPinned)
      .catch(() => {
        markJourneyFallback();
        return function JourneyPinnedFailed() {
          return null;
        };
      }),
  { ssr: false },
);

/**
 * Which version of the journey runs. Must match the CSS that shows one version or the other
 * (globals.css, "Farm to Table journey"), so the visible version is right from the first paint.
 */
const DESKTOP = "(min-width: 64rem)";

/** How long the desktop animation may take to load and start before the stacked version takes over. */
const PINNED_TIMEOUT = 10_000;

// --- Fallback to the stacked version ---------------------------------------------------------
// Two classes on <html>, both read by globals.css so the switch also works without React:
// - app-stalled: set by the head script when the app has not started 6s after load (layout.tsx)
// - journey-fallback: set here when the GSAP chunk fails or never starts
// Once set, the journey stays stacked for the rest of the visit (no switching back mid-read).
const FALLBACK = "journey-fallback";
const listeners = new Set<() => void>();

function markJourneyFallback() {
  document.documentElement.classList.add(FALLBACK);
  listeners.forEach((l) => l());
}

function subscribeFallback(onChange: () => void) {
  listeners.add(onChange);
  return () => void listeners.delete(onChange);
}

const getFallback = () => {
  const c = document.documentElement.classList;
  return c.contains(FALLBACK) || c.contains("app-stalled");
};
const getServerFallback = () => false;

/**
 * Drives the Farm to Table journey; the markup is server-rendered and passed in as children.
 *
 * Desktop (≥1024px, motion allowed): JourneyPinned (GSAP, loaded on demand) animates the sticky
 * stage. Phones, portrait tablets, reduced motion, and the fallback: stacked blocks (revealed by
 * the Motion kit); a light scroll listener here updates the sticky progress bar. No GSAP.
 */
export function JourneyScroller({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const wide = useMediaQuery(DESKTOP);
  const mode = useMotionMode();
  const fallback = useSyncExternalStore(subscribeFallback, getFallback, getServerFallback);
  const ready = mode !== "ssr";
  const reduced = mode === "reduced";
  const pinned = ready && wide && !reduced && !fallback;
  const version: JourneyVersion | null = ready ? (pinned ? "desktop" : "stacked") : null;

  useEffect(() => {
    if (!ready || pinned || !root.current) return;
    return setupStacked(root.current, reduced);
  }, [ready, pinned, reduced]);

  // The GSAP chunk loaded but hangs, or never got going: take the stacked version.
  // JourneyPinned marks the desktop track with data-pinned once its timeline is set up.
  useEffect(() => {
    if (!pinned) return;
    const id = window.setTimeout(() => {
      if (!root.current?.querySelector('[data-journey="desktop"][data-pinned]')) markJourneyFallback();
    }, PINNED_TIMEOUT);
    return () => window.clearTimeout(id);
  }, [pinned]);

  return (
    <JourneyVersionContext value={version}>
      <div ref={root}>
        {children}
        {pinned && <JourneyPinned />}
      </div>
    </JourneyVersionContext>
  );
}

/**
 * Stacked version: the progress bar shows the stage whose block crosses the middle of the
 * screen. Motion allowed: that stage's segment fills with its block's progress. Reduced motion:
 * segments switch whole, nothing slides. Only listens while the section is near the screen.
 */
function setupStacked(el: HTMLElement, reduced: boolean) {
  const wrap = el.querySelector<HTMLElement>('[data-journey="stacked"]');
  if (!wrap) return;
  const blocks = Array.from(wrap.querySelectorAll<HTMLElement>("[data-block]"));
  const fills = Array.from(wrap.querySelectorAll<HTMLElement>("[data-seg-fill]"));
  const labels = Array.from(wrap.querySelectorAll<HTMLElement>("[data-bar-label]"));

  let active = -1;
  const setActive = (i: number) => {
    if (i === active) return;
    active = i;
    labels.forEach((l, j) => l.toggleAttribute("data-current", j === i));
  };

  let frame = 0;
  const update = () => {
    frame = 0;
    const mid = window.innerHeight / 2;
    let current = active < 0 ? 0 : active;
    blocks.forEach((b, i) => {
      const r = b.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      if (r.top <= mid && r.bottom > mid) current = i;
      if (!reduced && fills[i]) fills[i].style.transform = `scaleX(${p})`;
    });
    // Above the first block: stage 1. Below the last: stays on the last.
    if (blocks[0] && blocks[0].getBoundingClientRect().top > mid) current = 0;
    setActive(current);
    if (reduced) fills.forEach((f, j) => (f.style.transform = j <= current ? "scaleX(1)" : "scaleX(0)"));
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  // Listen to scrolling only while the stacked section is on (or near) the screen.
  let listening = false;
  const near = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !listening) {
        listening = true;
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        onScroll();
      } else if (!entry.isIntersecting && listening) {
        listening = false;
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        onScroll(); // settle the final state (fully filled below, empty above)
      }
    },
    { rootMargin: "100% 0px" },
  );
  near.observe(wrap);
  update();

  return () => {
    near.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    cancelAnimationFrame(frame);
    fills.forEach((f) => (f.style.transform = ""));
    labels.forEach((l, j) => l.toggleAttribute("data-current", j === 0));
  };
}
