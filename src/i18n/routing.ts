import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "km"],
  defaultLocale: "en",
  localePrefix: "always",
  // No locale cookie: the locale lives only in the URL. (The language switch keeps the scroll
  // position in sessionStorage for one page load; see language-switch.tsx.)
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];
