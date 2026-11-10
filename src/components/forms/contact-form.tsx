"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PreviewForm, SelectField, TextAreaField, TextField, type Option, type OptionGroup } from "@/components/forms/form-kit";
import { LIMITS, validateContact } from "@/components/forms/validation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import { parseQuoteParams, type QuoteAllowList, type QuoteSelection } from "@/lib/quote-link";

export type ContactFormProps = {
  enquiryTypes: Option[];
  /** One group per cow part: "Any <part> cut" (value part:<id>) and its cuts (value cut:<id>). */
  interestGroups: OptionGroup[];
  /** Part and cut IDs a "Request a quote" link may preselect. */
  allow: QuoteAllowList;
};

/**
 * Contact form. A "Request a quote" link (/contact?part=…&cut=…) preselects "Order enquiry" and
 * the cut or part, but only for IDs in `allow`; any other query value is ignored and never shown.
 * The query is read in the browser (useSearchParams), so the page itself stays prerendered: the
 * server HTML holds the same form without a preselection, swapped in place once it runs.
 */
export function ContactForm(props: ContactFormProps) {
  return (
    <Suspense fallback={<ContactFields {...props} preset={null} />}>
      <ContactFormFromQuery {...props} />
    </Suspense>
  );
}

function ContactFormFromQuery(props: ContactFormProps) {
  const preset = parseQuoteParams(useSearchParams(), props.allow);
  // A new preselection (another quote link) starts a fresh form with the new defaults.
  return <ContactFields key={preset ? `${preset.part}:${preset.cut ?? ""}` : "none"} {...props} preset={preset} />;
}

function ContactFields({ enquiryTypes, interestGroups, preset }: ContactFormProps & { preset: QuoteSelection }) {
  const t = useTranslations("forms");
  const lang = useFallbackLang();
  const rules = {
    enquiryTypes: enquiryTypes.map((o) => o.value),
    interests: interestGroups.flatMap((g) => g.options.map((o) => o.value)),
  };
  const interest = preset ? (preset.cut ? `cut:${preset.cut}` : `part:${preset.part}`) : "";

  return (
    <PreviewForm id="contact-form" aria-labelledby="contact-form-heading" validate={(values) => validateContact(values, rules)}>
      {preset && (
        <p className="body-sm rounded-xl bg-card px-4 py-3" lang={lang("forms.fromQuote")}>
          {t("fromQuote")}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <TextField name="name" autoComplete="name" maxLength={LIMITS.name} />
        <TextField name="company" optional autoComplete="organization" maxLength={LIMITS.organization} />
        <TextField name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} />
        <TextField name="email" optional type="email" inputMode="email" autoComplete="email" maxLength={LIMITS.email} />
        <SelectField
          name="enquiryType"
          emptyLabel={{ text: t("chooseOne"), lang: lang("forms.chooseOne") }}
          options={enquiryTypes}
          defaultValue={preset ? "order" : ""}
        />
        <SelectField
          name="interest"
          optional
          emptyLabel={{ text: t("noPreference"), lang: lang("forms.noPreference") }}
          groups={interestGroups}
          defaultValue={interest}
        />
      </div>
      <TextAreaField name="message" maxLength={LIMITS.message} />
    </PreviewForm>
  );
}
