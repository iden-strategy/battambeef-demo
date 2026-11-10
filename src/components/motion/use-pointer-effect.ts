"use client";

import { useEffect, useEffectEvent } from "react";
import { useMotionMode } from "@/components/motion/use-motion-prefs";

type Effects = typeof import("@/components/motion/pointer-effects");

/**
 * Runs a desktop pointer effect, downloading its code only when a fine pointer is present and
 * motion is allowed (mode "fine"). On touch and with reduced motion nothing is downloaded.
 * `attach` receives the effects module and returns a cleanup.
 */
export function usePointerEffect(attach: (fx: Effects) => (() => void) | undefined, deps: unknown[]) {
  const mode = useMotionMode();
  const run = useEffectEvent(attach);

  useEffect(() => {
    if (mode !== "fine") return;
    let live = true;
    let cleanup: (() => void) | undefined;
    import("@/components/motion/pointer-effects").then((fx) => {
      if (live) cleanup = run(fx);
    });
    return () => {
      live = false;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's effect inputs
  }, [mode, ...deps]);
}
