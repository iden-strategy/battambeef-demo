import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { FALLBACK_KEY, mergeWithFallback } from "@/i18n/fallback";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ locale: override }) => {
  const requested = override ?? (await rootLocale());
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const english = (await import("../../messages/en.json")).default;
  if (locale === routing.defaultLocale) return { locale, messages: english };

  // Khmer (or any later locale): untranslated or "TODO-KM" strings fall back to English.
  const own = (await import(`../../messages/${locale}.json`)).default;
  const { messages, missing } = mergeWithFallback(own, english);
  return {
    locale,
    messages: { ...messages, [FALLBACK_KEY]: missing.join(",") } as unknown as typeof english,
  };
});
