"use client";

import { createContext, useContext, type ReactNode } from "react";

export type JourneyVersion = "desktop" | "stacked";

/** Which journey version is running; null until known (server render and hydration). */
export const JourneyVersionContext = createContext<JourneyVersion | null>(null);

/**
 * Renders its children (a stage photo) only while its journey version is the one running, so the
 * hidden version's photos are never downloaded.
 * Before the version is known (server HTML, hydration), only the stacked version (the one shown
 * without JavaScript) carries its photos, inside <noscript>: visible without JavaScript, never
 * fetched with it.
 */
export function JourneyVersionOnly({ version, children }: { version: JourneyVersion; children: ReactNode }) {
  const active = useContext(JourneyVersionContext);
  if (active === version) return children;
  if (active === null && version === "stacked") return <noscript>{children}</noscript>;
  return null;
}
