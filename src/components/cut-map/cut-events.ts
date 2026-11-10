// The cut map panel and the cuts grid live in separate sections of the page. They talk through
// one window event, so neither needs to know about the other.

import type { CowPartId } from "@/lib/data/cow-map";

export const FILTER_PART_EVENT = "bb:filter-part";

/** Ask the cuts grid (if the page has one) to show only this part and scroll to it. */
export function requestPartFilter(part: CowPartId) {
  window.dispatchEvent(new CustomEvent<CowPartId>(FILTER_PART_EVENT, { detail: part }));
}
