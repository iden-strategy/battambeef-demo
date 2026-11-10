import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/brand-logo";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { Link } from "@/i18n/navigation";
import { getContactDetails, getCopyrightYear, getNavItems, getSocialLinks } from "@/lib/data";

/** Dark like the page, but one step deeper with a hairline on top (.site-footer in globals.css). */
export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tHeader = await getTranslations("header");
  const lang = await getFallbackLang();
  const f = (key: string) => lang(`footer.${key}`);
  const navItems = getNavItems();
  const contacts = getContactDetails();
  const socials = getSocialLinks();

  return (
    <footer id="site-footer" data-surface="dark" className="site-footer relative overflow-hidden">
      <div className="container-page pt-20 pb-10 md:pt-28">
        {/* Light logo: the footer is always dark. */}
        <Link href="/" aria-label={tHeader("logo")} className="inline-block">
          <BrandLogo variant="light" className="h-14 sm:h-16 lg:h-20" />
        </Link>
        <p className="display-xl mt-12 max-w-[14ch] text-balance md:mt-16" lang={f("campaign")}>
          {t("campaign")}
        </p>
        <p className="body-lg mt-6 max-w-xl text-muted-foreground" lang={f("tagline")}>
          {t("tagline")}
        </p>

        <div className="mt-16 grid gap-10 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <nav aria-labelledby="footer-nav">
            <h2 id="footer-nav" className="label text-label" lang={f("navTitle")}>
              {t("navTitle")}
            </h2>
            <ul className="mt-4 space-y-1">
              {navItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    lang={lang(`nav.${item.key}`)}
                    className="body inline-flex min-h-11 items-center hover:underline"
                  >
                    {tNav(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="label text-label" lang={f("contactTitle")}>
              {t("contactTitle")}
            </h2>
            <dl className="mt-4 space-y-4">
              {contacts.map((c) => (
                <div key={c.key}>
                  <dt className="body-sm font-semibold" lang={f(c.key)}>
                    {t(c.key)}
                  </dt>
                  <dd className="body-sm text-muted-foreground" lang={c.value ? undefined : f("placeholder")}>
                    {c.value ?? t("placeholder")}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="label text-label" lang={f("socialTitle")}>
              {t("socialTitle")}
            </h2>
            <ul className="mt-4 space-y-1">
              {socials.map((s) => (
                <li key={s.id} className="body flex min-h-11 items-center gap-2">
                  {s.href ? (
                    <a href={s.href} rel="noopener noreferrer" target="_blank" className="hover:underline">
                      {s.name}
                    </a>
                  ) : (
                    <>
                      <span>{s.name}</span>
                      <span className="body-sm text-muted-foreground" lang={f("socialSoon")}>
                        · {t("socialSoon")}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-start gap-3">
            <span className="label rounded-full bg-brand-kraft px-3 py-1.5 text-brand-charcoal" lang={f("preview")}>
              {t("preview")}
            </span>
            <p className="body-sm text-muted-foreground" lang={f("previewNote")}>
              {t("previewNote")}
            </p>
          </div>
        </div>

        <p className="body-sm mt-14 text-muted-foreground" lang={f("rights")}>
          {t("rights", { year: String(getCopyrightYear()) })}
        </p>
      </div>
    </footer>
  );
}
