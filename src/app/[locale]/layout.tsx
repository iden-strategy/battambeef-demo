import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { CursorFollower } from "@/components/motion/cursor-follower";
import { MotionProvider } from "@/components/motion/lazy-motion";
import { BottomBar, BottomBarSpacer } from "@/components/shell/bottom-bar";
import { LocaleScrollRestore } from "@/components/shell/language-switch";
import { ShellProvider } from "@/components/shell/shell-context";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { pickClientMessages } from "@/i18n/client-messages";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { routing } from "@/i18n/routing";
import { getBrandColor, getNavItems, getQuickActions } from "@/lib/data";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  // Link previews need absolute image URLs: the Vercel production domain once deployed,
  // localhost otherwise. (Vercel sets this variable; it is not a secret.)
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return {
    metadataBase: new URL(host ? `https://${host}` : "http://localhost:3000"),
    title: { default: t("siteName"), template: t("titleTemplate") },
    description: t("description"),
    // Demo phase: never indexed (also robots.txt + X-Robots-Tag header).
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: getBrandColor("charcoal"),
};

// Runs before first paint. Only with `js-motion` does CSS hide in-view reveals until Motion
// plays them, so the server HTML stays readable without JavaScript (see globals.css).
// Failsafe: if the app has not started 6s later (blocked or failed bundle), `app-stalled` makes
// CSS show the versions of the page that work without JavaScript (e.g. the stacked journey).
// MotionProvider adds `app-ready` once React has hydrated. Keep 6s in step with globals.css.
const MOTION_FLAG = `(function(){var d=document.documentElement;d.classList.add("js-motion");setTimeout(function(){if(!d.classList.contains("app-ready"))d.classList.add("app-stalled")},6000)})()`;

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations("a11y");
  const lang = await getFallbackLang();
  const quick = getQuickActions();
  // Only the message sections client components use are sent to the browser.
  const clientMessages = pickClientMessages(await getMessages());

  return (
    // suppressHydrationWarning: the head script adds a class to <html> before React hydrates.
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_FLAG }} />
      </head>
      <body>
        <NextIntlClientProvider messages={clientMessages}>
          <ShellProvider>
            <MotionProvider>
            <a
              id="skip-link"
              href="#main-content"
              lang={lang("a11y.skipToContent")}
              className="fixed top-3 left-3 z-[60] -translate-y-24 rounded-full bg-brand-kraft px-5 py-3 font-semibold text-brand-charcoal focus-visible:translate-y-0"
            >
              {t("skipToContent")}
            </a>
            <SiteHeader navItems={getNavItems()} />
            <main id="main-content" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <SiteFooter />
            <BottomBarSpacer />
            <BottomBar contact={quick.contact} quoteHref={quick.quote} />
            <CursorFollower />
            <LocaleScrollRestore />
            </MotionProvider>
          </ShellProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
