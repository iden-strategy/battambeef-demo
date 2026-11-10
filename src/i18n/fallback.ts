// Missing translations fall back to English (CLAUDE.md section 12: never invent Khmer copy).
// A Khmer value counts as missing when it is absent or still holds a "TODO-KM" marker; the
// markers stay in messages/km.json so the team can see what still needs writing.
//
// The keys that fell back travel with the messages (under FALLBACK_KEY) so components can mark
// that text lang="en" for screen readers and fonts, on the server and in the browser alike.

type Tree = { [key: string]: string | Tree };

export const FALLBACK_KEY = "__fallbackKeys";
export const MISSING_MARKER = "TODO-KM";

const isMissing = (value: unknown) => typeof value !== "string" || value.includes(MISSING_MARKER);

/** Fills every missing leaf of `primary` from `fallback`, and lists the keys it filled. */
export function mergeWithFallback(primary: Tree, fallback: Tree): { messages: Tree; missing: string[] } {
  const missing: string[] = [];
  const walk = (p: Tree | undefined, f: Tree, path: string): Tree => {
    const out: Tree = {};
    for (const [key, fValue] of Object.entries(f)) {
      const pValue = p?.[key];
      const full = path ? `${path}.${key}` : key;
      if (typeof fValue === "string") {
        if (isMissing(pValue)) {
          out[key] = fValue;
          missing.push(full);
        } else {
          out[key] = pValue as string;
        }
      } else {
        out[key] = walk(typeof pValue === "object" ? pValue : undefined, fValue, full);
      }
    }
    return out;
  };
  return { messages: walk(primary, fallback, ""), missing };
}

export type FallbackLang = (key: string) => "en" | undefined;

/** Builds the lookup from loaded messages: `lang("nav.home")` is "en" when that text fell back. */
export function fallbackLangFrom(messages: unknown): FallbackLang {
  const raw = (messages as Record<string, unknown> | null)?.[FALLBACK_KEY];
  const keys = new Set(typeof raw === "string" && raw ? raw.split(",") : []);
  return (key) => (keys.has(key) ? "en" : undefined);
}
