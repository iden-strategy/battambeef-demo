import { getTranslations } from "next-intl/server";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { Link } from "@/i18n/navigation";
import { getBusinessNav, type BusinessNavKey } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Sub-navigation of the For Business pages (Overview · Beef Cuts · Beef Knowledge), at the top of
 * each page's opening band. Server-rendered: the page says which link is current, so no client
 * JavaScript. Not animated, so it is there from the first paint.
 * Compact on phones: one row at 360px (smaller label and padding, small gap below), pills still
 * 44px tall. It sits above each page's title, and on Beef Cuts above the cut-map photo (the
 * mobile LCP), so every pixel here pushes that photo toward the fold. If longer labels arrive
 * later, the row wraps rather than clipping or scrolling sideways.
 */
export async function BusinessSubnav({ active, className }: { active: BusinessNavKey; className?: string }) {
  const t = await getTranslations("businessNav");
  const lang = await getFallbackLang();

  return (
    <nav aria-label={t("label")} lang={lang("businessNav.label")} className={cn("mb-5 md:mb-10", className)}>
      <ul className="flex flex-wrap gap-1 xs:gap-2">
        {getBusinessNav().map(({ key, href }) => {
          const current = key === active;
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                lang={lang(`businessNav.${key}`)}
                className={cn(
                  // Size through --fs (body-sm), so Khmer still gets its 8% larger text.
                  "body-sm inline-flex min-h-11 items-center rounded-full border-[1.5px] font-medium whitespace-nowrap transition-colors duration-150 px-2.5 [--fs:0.8125rem] xs:px-4 xs:[--fs:0.875rem]",
                  current
                    ? "border-foreground bg-foreground text-background"
                    : "border-border [@media(hover:hover)]:hover:border-foreground",
                )}
              >
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
