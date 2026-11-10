import { Send } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/forms/contact-form";
import { IconBadge } from "@/components/icons";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { PageHero } from "@/components/page-hero";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { ScopedMessages } from "@/i18n/scoped-messages";
import { getContactCards, getContactDetails, getCowMap, getCutsByPart, getEnquiryTypes, getSocialLinks, getQuickActions } from "@/lib/data";
import { pageMetadata } from "@/lib/metadata";

export const generateMetadata = () => pageMetadata("contact");

/**
 * Contact: who to contact, the contact form and social placeholders. Surfaces: dark hero and
 * cards, light form (easier to read and fill in), dark social band.
 * Contact details are placeholders until the team provides them (CLAUDE.md section 12).
 */
export default async function Page() {
  const t = await getTranslations("contact");
  const tf = await getTranslations("footer");
  const tForm = await getTranslations("forms.fields");
  const tParts = await getTranslations("cutMap.parts");
  const lang = await getFallbackLang();
  const k = (key: string) => lang(`contact.${key}`);
  const tx = (key: Parameters<typeof t>[0]) => ({ text: t(key), lang: k(key) });
  const details = new Map(getContactDetails().map((d) => [d.key, d.value]));
  const parts = [...getCowMap().parts].sort((a, b) => a.number - b.number);
  const telegram = getQuickActions().contact;

  return (
    <>
      {/* 1. Hero (dark) */}
      <PageHero label={tx("hero.label")} title={tx("hero.title")} body={tx("hero.body")} titleClassName="max-w-[10ch]" />

      {/* 2. Contact cards (dark) */}
      <section data-surface="dark" aria-labelledby="cards-heading" className="pb-16 md:pb-24">
        <div className="container-page">
          <h2 id="cards-heading" className="sr-only" lang={k("cards.title")}>
            {t("cards.title")}
          </h2>
          <Reveal as="ul" stagger={0.1} className="grid gap-4 md:grid-cols-3 lg:gap-6">
            {getContactCards().map(({ id, icon, details: keys }) => (
              <RevealItem key={id} as="li" className="flex flex-col gap-4 rounded-2xl bg-card p-6 sm:p-8">
                <IconBadge name={icon} />
                <div>
                  <h3 className="title-md [--fs:clamp(1.25rem,1.1rem+0.5vw,1.5rem)]" lang={k(`cards.items.${id}.title`)}>
                    {t(`cards.items.${id}.title`)}
                  </h3>
                  <p className="body mt-1.5 text-muted-foreground" lang={k(`cards.items.${id}.body`)}>
                    {t(`cards.items.${id}.body`)}
                  </p>
                </div>
                <dl className="mt-auto grid gap-3 border-t border-border pt-4">
                  {keys.map((key) => {
                    const value = details.get(key) ?? null;
                    return (
                      <div key={key}>
                        <dt className="body-sm font-semibold" lang={lang(`footer.${key}`)}>
                          {tf(key)}
                        </dt>
                        <dd className="body-sm text-muted-foreground" lang={value ? undefined : lang("footer.placeholder")}>
                          {value ?? tf("placeholder")}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </section>

      {/* 3. Contact form (light). A valid "Request a quote" link preselects the cut or part. */}
      <section id="message" data-surface="light" aria-labelledby="contact-form-heading" className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
            <SectionHeading id="contact-form-heading" label={tx("form.label")} title={tx("form.title")} />
          </div>
          <ScopedMessages namespaces={["forms"]}>
            <ContactForm
              enquiryTypes={getEnquiryTypes().map((v) => ({
                value: v,
                label: tForm(`enquiryType.options.${v}`),
                lang: lang(`forms.fields.enquiryType.options.${v}`),
              }))}
              interestGroups={parts.map((part) => {
                const partName = tParts(part.id);
                return {
                  label: partName,
                  lang: lang(`cutMap.parts.${part.id}`),
                  options: [
                    { value: `part:${part.id}`, label: tForm("interest.anyCut", { part: partName }), lang: lang("forms.fields.interest.anyCut") },
                    // Cut names are English (Khmer names in the option would mix scripts in one line).
                    ...getCutsByPart(part.id).map((cut) => ({ value: `cut:${cut.id}`, label: cut.nameEn, lang: "en" })),
                  ],
                };
              })}
              allow={{
                parts: parts.map((p) => p.id),
                cuts: parts.flatMap((p) => getCutsByPart(p.id).map((c) => ({ id: c.id, part: c.part }))),
              }}
            />
          </ScopedMessages>
        </div>
      </section>

      {/* 4. Telegram and social (dark). Placeholders until the accounts exist. */}
      <section data-surface="dark" aria-labelledby="social-heading" className="section-sm">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHeading id="social-heading" label={tx("social.label")} title={tx("social.title")} body={tx("social.body")} />
          <div className="flex flex-col items-start gap-5 lg:items-end">
            {telegram.kind === "telegram" ? (
              <Button asChild size="lg">
                <a href={telegram.href} rel="noopener noreferrer" target="_blank" lang={lang("footer.telegram")}>
                  <Send aria-hidden />
                  {tf("telegram")}
                </a>
              </Button>
            ) : (
              <Button size="lg" disabled aria-describedby="telegram-soon" lang={lang("footer.telegram")}>
                <Send aria-hidden />
                {tf("telegram")}
              </Button>
            )}
            <ul className="flex flex-wrap gap-2">
              {getSocialLinks().map((s) => (
                <li key={s.id}>
                  {s.href ? (
                    <a href={s.href} rel="noopener noreferrer" target="_blank" className="body-sm inline-flex min-h-11 items-center rounded-full border border-border px-4 font-medium">
                      {s.name}
                    </a>
                  ) : (
                    <span className="body-sm inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-4 font-medium text-muted-foreground">
                      {s.name}
                      <span lang={k("social.soon")}>· {t("social.soon")}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <span id="telegram-soon" className="sr-only" lang={k("social.soon")}>
              {t("social.soon")}
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
