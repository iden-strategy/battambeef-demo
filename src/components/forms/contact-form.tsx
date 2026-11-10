"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { PreviewForm, SelectField, TextAreaField, TextField, type Option, type OptionGroup } from "@/components/forms/form-kit";
import { LIMITS, validateContact } from "@/components/forms/validation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import { parseQuoteParams, type QuoteAllowList } from "@/lib/quote-link";

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
 * The form itself is rendered once and never re-created. Only a small child reads the query
 * (useSearchParams needs a Suspense boundary so the page stays prerendered); it fills the two
 * selects only while they are still untouched, so nothing the visitor typed can be cleared.
 */
export function ContactForm({ enquiryTypes, interestGroups, allow }: ContactFormProps) {
  const t = useTranslations("forms");
  const lang = useFallbackLang();
  const rules = {
    enquiryTypes: enquiryTypes.map((o) => o.value),
    interests: interestGroups.flatMap((g) => g.options.map((o) => o.value)),
  };

  return (
    <PreviewForm id="contact-form" aria-labelledby="contact-form-heading" validate={(values) => validateContact(values, rules)}>
      <Suspense fallback={null}>
        <QuotePreset allow={allow} />
      </Suspense>
      <div className="grid gap-6 md:grid-cols-2">
        <TextField name="name" autoComplete="name" maxLength={LIMITS.name} />
        <TextField name="company" optional autoComplete="organization" maxLength={LIMITS.organization} />
        <TextField name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} />
        <TextField name="email" optional type="email" inputMode="email" autoComplete="email" maxLength={LIMITS.email} />
        <SelectField
          name="enquiryType"
          emptyLabel={{ text: t("chooseOne"), lang: lang("forms.chooseOne") }}
          options={enquiryTypes}
          defaultValue=""
        />
        <SelectField
          name="interest"
          optional
          emptyLabel={{ text: t("noPreference"), lang: lang("forms.noPreference") }}
          groups={interestGroups}
          defaultValue=""
        />
      </div>
      <TextAreaField name="message" maxLength={LIMITS.message} />
    </PreviewForm>
  );
}

function QuotePreset({ allow }: { allow: QuoteAllowList }) {
  const t = useTranslations("forms");
  const lang = useFallbackLang();
  const preset = parseQuoteParams(useSearchParams(), allow);
  const ref = useRef<HTMLParagraphElement>(null);
  const interest = preset ? (preset.cut ? `cut:${preset.cut}` : `part:${preset.part}`) : "";

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!preset || !form) return;
    const fill = (name: string, value: string) => {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLSelectElement && el.value === "") el.value = value;
    };
    fill("enquiryType", "order");
    fill("interest", interest);
  }, [preset, interest]);

  if (!preset) return null;
  return (
    <p ref={ref} className="body-sm rounded-xl bg-card px-4 py-3" lang={lang("forms.fromQuote")}>
      {t("fromQuote")}
    </p>
  );
}
