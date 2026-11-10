"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import type { CursorLabel } from "@/components/motion/cursor-target";
import { useMotionMode } from "@/components/motion/use-motion-prefs";

/** The last pointer position (and what it was over) seen before the follower's code arrived. */
export type PointerSnapshot = { x: number; y: number; label: CursorLabel | null };

// The follower's code (springs, presence animation) is its own chunk: downloaded only with a
// fine pointer and motion allowed. Phones and reduced motion never load it.
const Follower = dynamic(() => import("@/components/motion/cursor-follower-impl").then((mod) => mod.Follower), {
  ssr: false,
});

/**
 * A small ring that trails the native cursor (which is never hidden) and grows into a labelled
 * disc over elements marked with data-cursor="drag" | "explore" | "view".
 * Desktop with a fine pointer only. Not rendered (or downloaded) on touch or with reduced motion.
 */
export function CursorFollower() {
  const mode = useMotionMode();
  const fine = mode === "fine";
  // While the chunk downloads, remember where the pointer is, so the follower starts in the
  // right place with the right label instead of waiting for the next mouse move.
  const latest = useRef<PointerSnapshot | null>(null);

  useEffect(() => {
    if (!fine) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target instanceof Element ? e.target.closest("[data-cursor]") : null;
      latest.current = { x: e.clientX, y: e.clientY, label: (target?.getAttribute("data-cursor") as CursorLabel | null) ?? null };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [fine]);

  const getLatest = useCallback(() => latest.current, []);

  if (!fine) return null;
  return <Follower getLatest={getLatest} />;
}
