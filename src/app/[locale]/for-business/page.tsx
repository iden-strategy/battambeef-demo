import { getLocale, getTranslations } from "next-intl/server";
import { BusinessForm } from "@/components/forms/business-form";
import { IconBadge } from "@/components/icons";
import { CountUp } from "@/components/motion/count-up";
import { DrawnLine } from "@/components/motion/drawn-line";
import { MagneticButton } from "@/components/motion/magnetic-button";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { Link } from "@/i18n/navigation";
import { ScopedMessages } from "@/i18n/scoped-messages";
import { getBusinessOffers, getBusinessSteps, getBusinessTypes, getChillHours, getCuts, getWeeklyVolumes, getWhyPoints } from "@/lib/data";
import { pageMetadata } from "@/lib/metadata";

export const generateMetadata = () => pageMetadata("forBusiness");

const SMALL_TITLE = "title-md [--fs:clamp(1.25rem,1.1rem+0.5vw,1.5rem)]";

/**
 * For Business: a reliable partner for professional kitchens. Surfaces: dark hero and offers,
 * light steps (breathing section), kraft reasons, light enquiry form (easier to read and fill in).
 * Only the 72-hour chilling point is stated as fact; the rest says "Details being confirmed".
 */
export default async function Page() {
  const t = await getTranslations("forBusiness");
  const tf = await getTranslations("forms.fields");
  const locale = await getLocale();
  const lang = await getFallbackLang();
  const tx = (key: Parameters<typeof t>[0]) => ({ text: t(key), lang: lang(`forBusiness.${key}`) });
  const steps = getBusinessSteps();

  return (
    <>
      {/* 1. Hero (dark). "Request a quote" jumps to the enquiry form on this page. */}
      <PageHero
        label={tx("hero.label")}
        title={tx("hero.title")}
        body={tx("hero.body")}
        actions={
          <>
            <MagneticButton>
              <Button asChild size="lg">
                <a href="#enquiry" lang={lang("forBusiness.hero.quote")}>
                  {t("hero.quote")}
                </a>
              </Button>
            </MagneticButton>
            <Button asChild size="lg" variant="outline">
              <Link href="/beef-cuts" lang={lang("forBusiness.hero.cuts")}>
                {t("hero.cuts")}
              </Link>
            </Button>
          </>
        }
      />

      {/* 2. Offers (dark): tilt cards on desktop, flat on touch. */}
      <section data-surface="dark" aria-labelledby="offers-heading" className="section-sm border-t border-border">
        <div className="container-page">
          <SectionHeading id="offers-heading" label={tx("offers.label")} title={tx("offers.title")} />
          <Reveal as="ul" stagger={0.1} className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3 lg:gap-6">
            {getBusinessOffers().map(({ id, icon, verify }) => (
              <RevealItem key={id} as="li">
                <TiltCard className="h-full rounded-2xl bg-card">
                  <article className="flex h-full flex-col gap-4 p-6 sm:p-8">
                    <IconBadge name={icon} />
                    <h3 className={`${SMALL_TITLE} mt-2`} lang={lang(`forBusiness.offers.items.${id}.title`)}>
                      {t(`offers.items.${id}.title`)}
                    </h3>
                    <p className="body text-muted-foreground" lang={lang(`forBusiness.offers.items.${id}.body`)}>
                      {t(`offers.items.${id}.body`)}
                    </p>
                    {verify && (
                      <p className="label mt-auto pt-2 text-muted-foreground" lang={lang("forBusiness.offers.pendingNote")}>
                        {t("offers.pendingNote")}
                      </p>
                    )}
                  </article>
                </TiltCard>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 3. How to work with us (light: breathing section). The line between the steps draws
          itself with the scroll: vertical on phones, horizontal from 1024px. */}
      <section data-surface="light" aria-labelledby="steps-heading" className="section">
        <div className="container-page">
          <SectionHeading id="steps-heading" label={tx("steps.label")} title={tx("steps.title")} />
          <DrawnLine className="mt-12 md:mt-16">
            <Reveal as="ol" stagger={0.12} className="grid gap-10 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-0">
              {steps.map((id, i) => (
                <RevealItem key={id} as="li" className="relative grid grid-cols-[3rem_1fr] content-start gap-x-5 lg:grid-cols-1 lg:gap-y-6">
                  {i < steps.length - 1 && (
                    <>
                      {/* Track (steel) and drawn line (crimson). Phones: down to the next step. */}
                      <span aria-hidden className="absolute top-12 -bottom-10 left-6 w-0.5 -translate-x-1/2 bg-border lg:hidden">
                        <span data-draw="y" className="block size-full origin-top bg-primary" />
                      </span>
                      {/* From 1024px: across to the next step. */}
                      <span aria-hidden className="absolute top-6 left-12 -right-6 hidden h-0.5 -translate-y-1/2 bg-border lg:block">
                        <span data-draw="x" className="block size-full origin-left bg-primary" />
                      </span>
                    </>
                  )}
                  <span
                    aria-hidden
                    className="label tabular relative flex size-12 items-center justify-center rounded-full border-2 border-primary bg-background text-foreground"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="pt-2 lg:pt-0 lg:pe-6">
                    <p className="sr-only" lang={lang("forBusiness.steps.stepOf")}>
                      {t("steps.stepOf", { n: i + 1 })}
                    </p>
                    <h3 className={SMALL_TITLE} lang={lang(`forBusiness.steps.items.${id}.title`)}>
                      {t(`steps.items.${id}.title`)}
                    </h3>
                    <p className="body mt-2 text-muted-foreground" lang={lang(`forBusiness.steps.items.${id}.body`)}>
                      {t(`steps.items.${id}.body`)}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </Reveal>
          </DrawnLine>
        </div>
      </section>

      {/* 4. Why BattamBeef (kraft: this page's one kraft section). */}
      <section data-surface="kraft" aria-labelledby="why-heading" className="section">
        <div className="container-page">
          <SectionHeading id="why-heading" label={tx("why.label")} title={tx("why.title")} titleClassName="text-accent-text" />
          <Reveal as="ul" stagger={0.1} className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-4 lg:gap-6">
            {getWhyPoints().map(({ id, fact, verify }) => (
              <RevealItem key={id} as="li" className="flex flex-col gap-3 rounded-2xl bg-card p-6">
                {fact ? (
                  // The verified fact gets the big number (crimson on kraft: large text only).
                  <CountUp
                    to={getChillHours()}
                    className="font-display text-[clamp(3.5rem,2.5rem+3vw,5rem)] leading-[0.9] font-black tracking-[-0.04em] text-accent-text"
                  />
                ) : (
                  <span aria-hidden className="block h-px w-10 bg-foreground/40" />
                )}
                <h3 className={`${SMALL_TITLE} mt-2`} lang={lang(`forBusiness.why.items.${id}.title`)}>
                  {t(`why.items.${id}.title`)}
                </h3>
                <p className="body text-muted-foreground" lang={lang(`forBusiness.why.items.${id}.body`)}>
                  {t(`why.items.${id}.body`)}
                </p>
                {verify && (
                  <p className="label mt-auto pt-2" lang={lang("forBusiness.why.pendingNote")}>
                    {t("why.pendingNote")}
                  </p>
                )}
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 5. Business enquiry form (light: easier to read and fill in). */}
      <section id="enquiry" data-surface="light" aria-labelledby="enquiry-heading" className="section border-t border-border">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
            <SectionHeading id="enquiry-heading" label={tx("enquiry.label")} title={tx("enquiry.title")} body={tx("enquiry.body")} />
          </div>
          <ScopedMessages namespaces={["forms"]}>
            <BusinessForm
              businessTypes={getBusinessTypes().map((v) => ({
                value: v,
                label: tf(`businessType.options.${v}`),
                lang: lang(`forms.fields.businessType.options.${v}`),
              }))}
              volumes={getWeeklyVolumes().map((v) => ({
                value: v,
                label: tf(`volume.options.${v}`),
                lang: lang(`forms.fields.volume.options.${v}`),
              }))}
              cuts={getCuts().map((c) =>
                locale === "km" && c.nameKm ? { value: c.id, label: c.nameKm, lang: "km" } : { value: c.id, label: c.nameEn, lang: locale === "km" ? "en" : undefined },
              )}
            />
          </ScopedMessages>
        </div>
      </section>
    </>
  );
}
