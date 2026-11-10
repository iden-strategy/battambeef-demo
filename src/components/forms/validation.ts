// Form rules for the demo forms. Pure functions (no React, no browser APIs), so the e2e suite can
// test them directly. Each validator returns { field: errorKey }, where errorKey is a message key
// under "forms." (messages/en.json). Nothing here stores or sends anything.

export const LIMITS = {
  name: 100,
  organization: 120,
  email: 254,
  area: 120,
  message: 2000,
} as const;

export const MESSAGE_MIN = 10;

export type Values = Record<string, string | string[]>;
export type Errors = Record<string, string>;

const str = (values: Values, name: string) => {
  const v = values[name];
  return (Array.isArray(v) ? v[0] ?? "" : v ?? "").trim();
};

/**
 * Cambodian phone numbers, as people usually write them:
 * 012 345 678 · 0123456789 · 023 123 456 · +855 12 345 678 · 855-12-345-678 · +855 (0)12 345 678
 * Spaces, dashes, dots and brackets are ignored. Then: a leading 0 or +855/855 (optionally
 * followed by the 0), and 8–9 more digits, the first of which is not 0.
 */
export function isCambodianPhone(raw: string): boolean {
  const compact = raw.replace(/[\s\-.()]/g, "");
  return /^(?:\+?8550?|0)[1-9]\d{7,8}$/.test(compact);
}

export function isEmail(raw: string): boolean {
  return raw.length <= LIMITS.email && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(raw);
}

function requiredText(errors: Errors, values: Values, name: string, max: number, requiredKey: string) {
  const v = str(values, name);
  if (!v) errors[name] = requiredKey;
  else if (v.length > max) errors[name] = "errors.tooLong";
}

function optionalText(errors: Errors, values: Values, name: string, max: number) {
  if (str(values, name).length > max) errors[name] = "errors.tooLong";
}

function phone(errors: Errors, values: Values) {
  const v = str(values, "phone");
  if (!v) errors.phone = "fields.phone.errorRequired";
  else if (!isCambodianPhone(v)) errors.phone = "fields.phone.errorFormat";
}

function optionalEmail(errors: Errors, values: Values) {
  const v = str(values, "email");
  if (v && !isEmail(v)) errors.email = "fields.email.errorFormat";
}

function oneOf(errors: Errors, values: Values, name: string, allowed: readonly string[], key: string, required: boolean) {
  const v = str(values, name);
  if (!v) {
    if (required) errors[name] = key;
  } else if (!allowed.includes(v)) {
    errors[name] = key;
  }
}

export type ContactRules = { enquiryTypes: readonly string[]; interests: readonly string[] };

/** Contact form: name, company (optional), phone, email (optional), enquiry type, interest (optional), message. */
export function validateContact(values: Values, rules: ContactRules): Errors {
  const errors: Errors = {};
  requiredText(errors, values, "name", LIMITS.name, "fields.name.errorRequired");
  optionalText(errors, values, "company", LIMITS.organization);
  phone(errors, values);
  optionalEmail(errors, values);
  oneOf(errors, values, "enquiryType", rules.enquiryTypes, "fields.enquiryType.errorRequired", true);
  oneOf(errors, values, "interest", rules.interests, "fields.interest.errorInvalid", false);
  const message = str(values, "message");
  if (message.length < MESSAGE_MIN) errors.message = "fields.message.errorShort";
  else if (message.length > LIMITS.message) errors.message = "errors.tooLong";
  return errors;
}

export type BusinessRules = { businessTypes: readonly string[]; volumes: readonly string[]; cuts: readonly string[] };

/** Business enquiry: business and contact name, phone, email (optional), business type; the rest optional. */
export function validateBusiness(values: Values, rules: BusinessRules): Errors {
  const errors: Errors = {};
  requiredText(errors, values, "businessName", LIMITS.organization, "fields.businessName.errorRequired");
  requiredText(errors, values, "contactName", LIMITS.name, "fields.contactName.errorRequired");
  phone(errors, values);
  optionalEmail(errors, values);
  oneOf(errors, values, "businessType", rules.businessTypes, "fields.businessType.errorRequired", true);
  oneOf(errors, values, "volume", rules.volumes, "fields.volume.errorInvalid", false);
  const cuts = values.cuts;
  if (Array.isArray(cuts) && cuts.some((c) => !rules.cuts.includes(c))) errors.cuts = "fields.cuts.errorInvalid";
  optionalText(errors, values, "area", LIMITS.area);
  optionalText(errors, values, "message", LIMITS.message);
  return errors;
}

/** The maximum length to mention in a "too long" error. */
export const maxFor = (name: string): number =>
  ({ name: LIMITS.name, contactName: LIMITS.name, company: LIMITS.organization, businessName: LIMITS.organization, area: LIMITS.area, message: LIMITS.message })[
    name
  ] ?? LIMITS.message;
