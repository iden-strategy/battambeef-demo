"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a media query matches. The server (and the hydration pass) always sees `false`, so
 * markup matches; the real value arrives right after hydration and follows changes.
 * Use it to decide whether to load desktop-only code at all.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
