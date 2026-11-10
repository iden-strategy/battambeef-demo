"use client";

import { useSyncExternalStore } from "react";

export type MotionMode = "ssr" | "reduced" | "fine" | "touch";

const REDUCED = "(prefers-reduced-motion: reduce)";
const FINE = "(hover: hover) and (pointer: fine)";

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(REDUCED), window.matchMedia(FINE)];
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
}

/** The current mode, read directly (browser only). Used when an animation starts. */
export function readMotionMode(): Exclude<MotionMode, "ssr"> {
  if (window.matchMedia(REDUCED).matches) return "reduced";
  return window.matchMedia(FINE).matches ? "fine" : "touch";
}

const getSnapshot = readMotionMode;

// The server (and the hydration pass) always sees "ssr", so markup matches;
// the real mode arrives right after hydration.
function getServerSnapshot(): MotionMode {
  return "ssr";
}

/**
 * Motion preferences as one value:
 * - "reduced": prefers-reduced-motion is on (no movement, short fades only)
 * - "fine": desktop mouse/trackpad (pointer effects and blur allowed)
 * - "touch": phones and tablets (fade + slide only)
 * - "ssr": not known yet (server render and hydration)
 */
export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useMotionPrefs() {
  const mode = useMotionMode();
  return {
    mode,
    ready: mode !== "ssr",
    reduced: mode === "reduced",
    finePointer: mode === "fine",
  };
}
