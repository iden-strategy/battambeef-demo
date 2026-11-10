import { useMessages } from "next-intl";
import { useMemo } from "react";
import { fallbackLangFrom, type FallbackLang } from "@/i18n/fallback";

/** Client and non-async server components: `lang("nav.home")` → "en" when that text fell back. */
export function useFallbackLang(): FallbackLang {
  const messages = useMessages();
  return useMemo(() => fallbackLangFrom(messages), [messages]);
}
