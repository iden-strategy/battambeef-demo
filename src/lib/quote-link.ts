import type { CowPartId } from "@/lib/data/cow-map";

/**
 * Link to the Contact page with a part (and optionally a cut) preselected for the quote form.
 * Only IDs from cow-map.ts / cuts.ts are ever passed in here.
 */
export function quoteHref(part: CowPartId, cutId?: string): string {
  const params = new URLSearchParams({ part });
  if (cutId) params.set("cut", cutId);
  return `/contact?${params.toString()}`;
}

/** The IDs the form accepts: every cow part, and every cut with the part it belongs to. */
export type QuoteAllowList = { parts: readonly string[]; cuts: readonly { id: string; part: string }[] };

export type QuoteSelection = { part: string; cut: string | null } | null;

/** Longer than any real ID: such values are dropped before they are compared with anything. */
const MAX_ID_LENGTH = 40;

/**
 * Reads `?part=…&cut=…` from a "Request a quote" link. Untrusted input: a value is used only when
 * it exactly matches an ID in the allow list; anything else (unknown IDs, markup, very long
 * strings, a cut from another part) is silently ignored. Returns IDs from the allow list itself,
 * never the raw query value, so nothing from the URL can reach the page.
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

  if (cut && (!part || cut.part === part)) return { part: cut.part, cut: cut.id };
  if (part) return { part, cut: null };
  return null;
}
