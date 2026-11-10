import type { Cut } from "@/lib/data/cuts";

/**
 * Where "see it on the cut map" goes for a cut: its (first) part on the Beef Cuts map, or the
 * "All cuts" grid for a cut that is not on the map (trimmings, bones).
 */
export const cutMapHref = (cut: Pick<Cut, "parts">) =>
  cut.parts.length > 0 ? `/beef-cuts#${cut.parts[0]}` : "/beef-cuts#all-cuts";

/** True when the cut has a place on the cow map. */
export const isOnMap = (cut: Pick<Cut, "parts">) => cut.parts.length > 0;
