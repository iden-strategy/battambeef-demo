"use client";

import { useTranslations } from "next-intl";
import { CheckboxChips, PreviewForm, SelectField, TextAreaField, TextField, type Option } from "@/components/forms/form-kit";
import { LIMITS, validateBusiness } from "@/components/forms/validation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";

export type BusinessFormProps = {
  businessTypes: Option[];
  volumes: Option[];
  /** Every cut from getCuts() (value: cut id). */
  cuts: Option[];
};

/** For Business enquiry form. Validates like a real form; sends and stores nothing. */
export function BusinessForm({ businessTypes, volumes, cuts }: BusinessFormProps) {
  const t = useTranslations("forms");
  const lang = useFallbackLang();
  const rules = {
    businessTypes: businessTypes.map((o) => o.value),
    volumes: volumes.map((o) => o.value),
    cuts: cuts.map((o) => o.value),
  };
  const chooseOne = { text: t("chooseOne"), lang: lang("forms.chooseOne") };

  return (
    <PreviewForm
      id="business-form"
      aria-labelledby="enquiry-heading"
      multi={["cuts"]}
      submitKey="submitBusiness"
      validate={(values) => validateBusiness(values, rules)}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <TextField name="businessName" autoComplete="organization" maxLength={LIMITS.organization} />
        <TextField name="contactName" autoComplete="name" maxLength={LIMITS.name} />
        <TextField name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} />
        <TextField name="email" optional type="email" inputMode="email" autoComplete="email" maxLength={LIMITS.email} />
        <SelectField name="businessType" emptyLabel={chooseOne} options={businessTypes} />
        <SelectField name="volume" optional emptyLabel={chooseOne} options={volumes} />
      </div>
      <CheckboxChips name="cuts" options={cuts} />
      <TextField name="area" optional autoComplete="address-level2" maxLength={LIMITS.area} />
      <TextAreaField name="message" optional maxLength={LIMITS.message} />
    </PreviewForm>
  );
}
