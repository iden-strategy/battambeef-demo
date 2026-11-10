import { getMessages } from "next-intl/server";
import { fallbackLangFrom, type FallbackLang } from "@/i18n/fallback";

/** Async server components: `lang("footer.tagline")` → "en" when that text fell back. */
export async function getFallbackLang(): Promise<FallbackLang> {
  return fallbackLangFrom(await getMessages());
}
