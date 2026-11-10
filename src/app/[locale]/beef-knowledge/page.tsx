import { ArrowRight, Clock, Users } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Icon, IconBadge } from "@/components/icons";
import { MethodTabs } from "@/components/knowledge/method-tabs";
import { RecipeDialog } from "@/components/knowledge/recipe-dialog";
import { DragCarousel } from "@/components/motion/drag-carousel";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { PageHero } from "@/components/page-hero";
import { PlaceholderWord } from "@/components/placeholder-word";
import { SectionHeading } from "@/components/section-heading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { Link } from "@/i18n/navigation";
import { cutMapHref, isOnMap } from "@/lib/cut-links";
import { getCutById, getCutsByMethod, getFaq, getGuideMethods, getQuickLinks, getRecipes, getStorageCards, type Cut } from "@/lib/data";
import { pageMetadata } from "@/lib/metadata";

export const generateMetadata = () => pageMetadata("beefKnowledge");

const SMALL_TITLE = "title-md [--fs:clamp(1.25rem,1.1rem+0.5vw,1.5rem)]";

/**
 * Beef Knowledge: cuts, cooking, storage, recipes and FAQ. Surfaces: dark hero, quick links,
 * cooking methods and recipes; kraft storage; light FAQ (the breathing section).
 * Storage is general food-safety guidance only; nothing about BattamBeef products (TODO-VERIFY).
 */
export default async function Page() {
  const t = await getTranslations("beefKnowledge");
  const tm = await getTranslations("cutOptions.methods");
  const locale = await getLocale();
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`beefKnowledge.${key}`);
  const tx = (key: Parameters<typeof t>[0]) => ({ text: t(key), lang: k(key) });
  // Khmer pages show the checked Khmer cut name where there is one.
  const cutName = (cut: Cut) =>
    locale === "km" && cut.nameKm ? { text: cut.nameKm, lang: "km" } : { text: cut.nameEn, lang: locale === "km" ? "en" : undefined };
  const duration = (minutes: number) =>
    minutes < 60
      ? { text: t("recipes.minutes", { n: minutes }), lang: k("recipes.minutes") }
      : { text: t("recipes.hours", { h: Math.floor(minutes / 60), m: minutes % 60 }), lang: k("recipes.hours") };

  return (
    <>
      {/* 1. Hero (dark) */}
      <PageHero label={tx("hero.label")} title={tx("hero.title")} body={tx("hero.body")} titleClassName="max-w-[12ch]" />

      {/* 2. Quick links: large tiles */}
      <nav data-surface="dark" aria-labelledby="quick-links-heading" className="pb-16 md:pb-24">
        <div className="container-page">
          <h2 id="quick-links-heading" className="label text-label" lang={k("quickLinks.label")}>
            {t("quickLinks.label")}
          </h2>
          <Reveal as="ul" stagger={0.06} className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
            {getQuickLinks().map(({ id, href, icon }, i, all) => {
              // Same-page sections use a plain anchor; other pages the localized Link.
              const Tile = href.startsWith("#") ? "a" : Link;
              return (
              // Two per row on phones; an odd last tile spans the row.
              <RevealItem key={id} as="li" className={i === all.length - 1 && all.length % 2 ? "col-span-2 lg:col-span-1" : undefined}>
                <Tile
                  href={href}
                  className="group flex h-full min-h-36 flex-col justify-between gap-6 rounded-2xl bg-card p-4 xs:p-5 transition-colors duration-150 sm:p-6 lg:min-h-48 [@media(hover:hover)]:hover:bg-primary"
                >
                  <span className="flex items-center justify-between">
                    <Icon name={icon} className="size-6 text-accent-text transition-colors duration-150 [@media(hover:hover)]:group-hover:text-primary-foreground" />
                    <ArrowRight aria-hidden className="size-5 transition-transform duration-200 [@media(hover:hover)]:group-hover:translate-x-1" />
                  </span>
                  <span>
                    <span className={`${SMALL_TITLE} block`} lang={k(`quickLinks.items.${id}.title`)}>
                      {t(`quickLinks.items.${id}.title`)}
                    </span>
                    <span className="body-sm mt-1 block text-muted-foreground [@media(hover:hover)]:group-hover:text-primary-foreground/85" lang={k(`quickLinks.items.${id}.body`)}>
                      {t(`quickLinks.items.${id}.body`)}
                    </span>
                  </span>
                </Tile>
              </RevealItem>
              );
            })}
          </Reveal>
        </div>
      </nav>

      {/* 3. Cooking methods (dark): choose a method, see the guide and the matching cuts. */}
      <section id="cooking-methods" data-surface="dark" aria-labelledby="methods-heading" className="section border-t border-border">
        <div className="container-page">
          <SectionHeading id="methods-heading" label={tx("methods.label")} title={tx("methods.title")} />
          <MethodTabs
            label={t("methods.tabsLabel")}
            labelLang={k("methods.tabsLabel")}
            methods={getGuideMethods().map((method) => ({
              id: method,
              label: tm(method),
              lang: lang(`cutOptions.methods.${method}`),
              panel: (
                <div className="grid gap-8 rounded-2xl bg-card p-6 sm:p-8 lg:grid-cols-2 lg:gap-16 lg:p-12">
                  <div>
                    <p className="title-lg text-accent-text" lang={lang(`cutOptions.methods.${method}`)}>
                      {tm(method)}
                    </p>
                    <p className="body-lg mt-5 max-w-xl text-muted-foreground" lang={k(`methods.guides.${method}`)}>
                      {t(`methods.guides.${method}`)}
                    </p>
                  </div>
                  <div>
                    <h3 className="label text-label" lang={k("methods.cutsHeading")}>
                      {t("methods.cutsHeading")}
                    </h3>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {getCutsByMethod(method).map((cut) => {
                        const name = cutName(cut);
                        return (
                          <li key={cut.id}>
                            <Link
                              href={cutMapHref(cut)}
                              // Cuts that are not on the map (bones, trimmings) link to the grid instead.
                              aria-label={t(isOnMap(cut) ? "methods.cutLink" : "methods.cutLinkGrid", { cut: name.text })}
                              lang={name.lang}
                              className="body-sm inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-border px-4 font-medium transition-colors duration-150 [@media(hover:hover)]:hover:border-foreground [@media(hover:hover)]:hover:bg-foreground [@media(hover:hover)]:hover:text-background"
                            >
                              {name.text}
                              <ArrowRight aria-hidden className="size-3.5" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      </section>

      {/* 4. Storage guide (kraft: this page's one kraft section). General guidance only. */}
      <section id="storage" data-surface="kraft" aria-labelledby="storage-heading" className="section">
        <div className="container-page">
          <SectionHeading id="storage-heading" label={tx("storage.label")} title={tx("storage.title")} body={tx("storage.body")} titleClassName="text-accent-text" />
          <Reveal as="ul" stagger={0.08} className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-4 lg:gap-6">
            {getStorageCards().map(({ id, icon }) => (
              <RevealItem key={id} as="li" className="flex flex-col gap-4 rounded-2xl bg-card p-6">
                <IconBadge name={icon} />
                <h3 className={`${SMALL_TITLE} mt-1`} lang={k(`storage.items.${id}.title`)}>
                  {t(`storage.items.${id}.title`)}
                </h3>
                <p className="body" lang={k(`storage.items.${id}.body`)}>
                  {t(`storage.items.${id}.body`)}
                </p>
              </RevealItem>
            ))}
          </Reveal>
          {/* TODO-VERIFY: storage times and packaging for BattamBeef products (knowledge.ts). */}
          <p className="label mt-8" lang={k("storage.productNote")}>
            {t("storage.productNote")}
          </p>
        </div>
      </section>

      {/* 5. Recipes (dark): drag carousel; each card opens the full recipe. */}
      <section id="recipes" data-surface="dark" aria-labelledby="recipes-heading" className="section">
        <div className="container-page">
          <SectionHeading id="recipes-heading" label={tx("recipes.label")} title={tx("recipes.title")} />
        </div>
        <DragCarousel label={t("recipes.carouselLabel")} className="mt-8 md:mt-10">
          {getRecipes().map((recipe) => {
            const cut = getCutById(recipe.cutId);
            const name = cut ? cutName(cut) : null;
            const method = { text: tm(recipe.method), lang: lang(`cutOptions.methods.${recipe.method}`) };
            const title = { text: t(`recipes.items.${recipe.id}.title`), lang: k(`recipes.items.${recipe.id}.title`) };
            const intro = { text: t(`recipes.items.${recipe.id}.intro`), lang: k(`recipes.items.${recipe.id}.intro`) };
            const time = duration(recipe.minutes);
            const serves = { text: t("recipes.serves", { n: recipe.serves }), lang: k("recipes.serves") };
            const meta = (
              <p className="body-sm flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5" lang={serves.lang}>
                  <Users aria-hidden className="size-4" />
                  {serves.text}
                </span>
                <span className="tabular inline-flex items-center gap-1.5" lang={time.lang}>
                  <Clock aria-hidden className="size-4" />
                  {time.text}
                </span>
              </p>
            );
            const label = (
              <p className="label text-label">
                {name && <span lang={name.lang}>{name.text}</span>} · <span lang={method.lang}>{method.text}</span>
              </p>
            );
            return (
              <TiltCard key={recipe.id} className="h-full rounded-2xl bg-card">
                <article className="flex h-full flex-col">
                  <div aria-hidden className="stage-placeholder placeholder-fit relative flex aspect-[4/3] flex-col justify-end gap-2 overflow-hidden p-5 sm:p-6">
                    <PlaceholderWord variant="card" text={method.text} lang={method.lang} className="text-accent-text/85" />
                    <span className="body-sm text-muted-foreground" lang={k("recipes.photoSoon")}>
                      {t("recipes.photoSoon")}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                    {label}
                    <h3 className="title-md [--fs:clamp(1.25rem,1.1rem+0.6vw,1.625rem)]" lang={title.lang}>
                      {title.text}
                    </h3>
                    <p className="body text-muted-foreground" lang={intro.lang}>
                      {intro.text}
                    </p>
                    {meta}
                    <div className="mt-auto pt-1">
                      <RecipeDialog
                        open={{ text: t("recipes.open"), label: t("recipes.openLabel", { recipe: title.text }), lang: k("recipes.openLabel") }}
                        close={{ text: t("recipes.close"), lang: k("recipes.close") }}
                        title={title}
                      >
                        <div className="mt-3 grid gap-3">
                          {label}
                          <p className="body-lg text-muted-foreground" lang={intro.lang}>
                            {intro.text}
                          </p>
                          {meta}
                        </div>
                        <div className="mt-8 grid gap-8 md:grid-cols-[2fr_3fr] md:gap-10">
                          <div>
                            <h3 className="label text-label" lang={k("recipes.ingredients")}>
                              {t("recipes.ingredients")}
                            </h3>
                            <ul className="mt-4 grid gap-2.5">
                              {recipe.ingredients.map((key) => (
                                <li key={key} className="body flex gap-3" lang={k(`recipes.items.${recipe.id}.ingredients.${key}`)}>
                                  <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-primary" />
                                  {t(`recipes.items.${recipe.id}.ingredients.${key}` as Parameters<typeof t>[0])}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="label text-label" lang={k("recipes.steps")}>
                              {t("recipes.steps")}
                            </h3>
                            <ol className="mt-4 grid gap-4">
                              {recipe.steps.map((key, i) => (
                                <li key={key} className="body grid grid-cols-[2rem_1fr] gap-2" lang={k(`recipes.items.${recipe.id}.steps.${key}`)}>
                                  <span aria-hidden className="label tabular pt-1 text-label">
                                    {String(i + 1).padStart(2, "0")}
                                  </span>
                                  <span>{t(`recipes.items.${recipe.id}.steps.${key}` as Parameters<typeof t>[0])}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </RecipeDialog>
                    </div>
                  </div>
                </article>
              </TiltCard>
            );
          })}
        </DragCarousel>
      </section>

      {/* 6. FAQ (light: the breathing section). */}
      <section id="faq" data-surface="light" aria-labelledby="faq-heading" className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <SectionHeading id="faq-heading" label={tx("faq.label")} title={tx("faq.title")} className="lg:self-start" />
          <Accordion type="single" collapsible className="border-t border-border">
            {getFaq().map(({ id }) => (
              <AccordionItem key={id} value={id}>
                <AccordionTrigger>
                  <span className={SMALL_TITLE} lang={k(`faq.items.${id}.q`)}>
                    {t(`faq.items.${id}.q`)}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="body-lg max-w-2xl text-muted-foreground" lang={k(`faq.items.${id}.a`)}>
                    {t(`faq.items.${id}.a`)}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
