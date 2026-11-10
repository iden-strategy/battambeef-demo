// Which cow part is selected, shared through the URL hash (#rib) so a part can be linked.
// The URL hash is the single source of truth; components subscribe to "hashchange".
// history.replaceState (not location.hash =) so the browser never tries to scroll to an element
// with that id, and Back is not filled with one entry per tap. replaceState fires no event, so
// selectCowPart dispatches "hashchange" itself: that also keeps other URL readers (the language
// switch, which carries the hash across) in step with the address bar.

import type { CowPartId } from "@/lib/data/cow-map";

export const DEFAULT_PART: CowPartId = "rib";

export function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export const getHash = () => window.location.hash.slice(1);
export const getServerHash = () => "";

/** The part named by a hash string, or null when it is empty or not a known part. */
export function partFromHash(hash: string, ids: readonly string[]): CowPartId | null {
  return (ids.includes(hash) ? hash : null) as CowPartId | null;
}

export function selectCowPart(id: CowPartId) {
  window.history.replaceState(null, "", `#${id}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
