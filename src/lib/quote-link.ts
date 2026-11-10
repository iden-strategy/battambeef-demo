import type { CowPartId } from "@/lib/data/cow-map";
import type { Cut } from "@/lib/data/cuts";

/**
 * Link to the Contact page with a part and/or a cut preselected for the quote form.
 * Only IDs from cow-map.ts / cuts.ts are ever passed in here.
 */
export function quoteHref(part: CowPartId | null, cutId?: string): string {
  const params = new URLSearchParams();
  if (part) params.set("part", part);
  if (cutId) params.set("cut", cutId);
  return `/contact?${params.toString()}`;
}

/** "Request a quote" for one cut: its first part (if it has one) and the cut. */
export const cutQuoteHref = (cut: Pick<Cut, "id" | "parts">) => quoteHref(cut.parts[0] ?? null, cut.id);

/** The IDs the form accepts: every cow part, and every cut with the parts it belongs to (0, 1 or more). */
export type QuoteAllowList = { parts: readonly string[]; cuts: readonly { id: string; parts: readonly string[] }[] };

export type QuoteSelection = { part: string; cut: null } | { part: string | null; cut: string } | null;

/** Longer than any real ID: such values are dropped before they are compared with anything. */
const MAX_ID_LENGTH = 40;

/**
 * Reads `?part=…&cut=…` from a "Request a quote" link. Untrusted input: a value is used only when
 * it exactly matches an ID in the allow list; anything else (unknown IDs, old cut IDs that no
 * longer exist, markup, very long strings, a cut from another part) is silently ignored. Returns
 * IDs from the allow list itself, never the raw query value, so nothing from the URL can reach the
 * page. A cut on its own brings its first part, or no part for a cut that is not on the map.
 */
export function parseQuoteParams(params: Pick<URLSearchParams, "get">, allow: QuoteAllowList): QuoteSelection {
  const read = (name: string) => {
    const value = params.get(name);
    return value && value.length <= MAX_ID_LENGTH ? value : null;
  };
  const partParam = read("part");
  const cutParam = read("cut");

  const part = partParam === null ? undefined : allow.parts.find((p) => p === partParam);
  const cut = cutParam === null ? undefined : allow.cuts.find((c) => c.id === cutParam);

  if (cut && (!part || cut.parts.includes(part))) return { part: part ?? cut.parts[0] ?? null, cut: cut.id };
  if (part) return { part, cut: null };
  return null;
}
