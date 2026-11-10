import type { AbstractIntlMessages } from "next-intl";
import { FALLBACK_KEY } from "@/i18n/fallback";

/**
 * The message sections that client components read (useTranslations / useFallbackLang).
 * Only these are sent to the browser; everything else (page copy, metadata) is rendered on the
 * server and never shipped as messages. When a client component starts using a new section,
 * add it here (a missing section shows up as a MISSING_MESSAGE error in development and e2e).
 */
export const CLIENT_NAMESPACES = [
  "nav",
  "header",
  "language",
  "bottomBar",
  "kit",
  "errors",
  "cutMap",
  "cutOptions",
  "beefCuts.grid",
  "beefCuts.detail",
] as const;

type Tree = { [key: string]: string | Tree };

/**
 * The subset of `messages` for NextIntlClientProvider, including the matching fallback keys.
 * `extra`: sections only one part of a page needs (ScopedMessages, e.g. the forms), added to the
 * site-wide ones for that part only.
 */
export function pickClientMessages(messages: AbstractIntlMessages, extra: readonly string[] = []): AbstractIntlMessages {
  const namespaces = [...CLIENT_NAMESPACES, ...extra];
  const inClientNamespaces = (key: string) => namespaces.some((ns) => key === ns || key.startsWith(`${ns}.`));
  const source = messages as unknown as Tree;
  const out: Tree = {};
  for (const ns of namespaces) {
    const path = ns.split(".");
    let value: string | Tree | undefined = source;
    for (const part of path) value = typeof value === "object" ? value[part] : undefined;
    if (value === undefined) continue;
    let target = out;
    path.slice(0, -1).forEach((part) => (target = (target[part] ??= {}) as Tree));
    target[path[path.length - 1]] = value;
  }
  // Which of those strings fell back to English (Khmer pages), so they keep lang="en".
  const fallback = source[FALLBACK_KEY];
  if (typeof fallback === "string" && fallback) {
    out[FALLBACK_KEY] = fallback.split(",").filter(inClientNamespaces).join(",");
  }
  return out as AbstractIntlMessages;
}
