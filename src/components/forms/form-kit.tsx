"use client";

import { Check, ChevronDown, CircleAlert, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { maxFor, type Errors, type Values } from "@/components/forms/validation";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import { cn } from "@/lib/utils";

// Demo forms (CLAUDE.md section 11): they validate like real forms but send and store nothing.
// - no network request: submit is always prevented; there is no action URL
// - no storage: uncontrolled fields, no localStorage/sessionStorage/cookies, no drafts
// - without JavaScript the submit button stays disabled, so the browser can never submit the
//   form (with its values in the URL) on its own
// Messages: the "forms" section, sent to the browser only where a form is (ScopedMessages).

/** How long the "Sending…" state shows before "Preview only: not sent". */
const SEND_DELAY = 900;

type Status = "idle" | "sending" | "sent";

type LooseT = ((key: string, values?: Record<string, string | number>) => string) & { has: (key: string) => boolean };

/** The "forms" messages, looked up by keys built from field names (fields.<name>.label …). */
function useFormsT(): LooseT {
  return useTranslations("forms") as unknown as LooseT;
}

type FormContext = { formId: string; errors: Errors };
const Ctx = createContext<FormContext>({ formId: "form", errors: {} });

const noopSubscribe = () => () => {};
/** false in the server HTML and during hydration, true once React runs in the browser. */
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

function readValues(form: HTMLFormElement, multi: readonly string[]): Values {
  const data = new FormData(form);
  const out: Values = {};
  for (const name of new Set(data.keys())) {
    const all = data.getAll(name).filter((v): v is string => typeof v === "string");
    out[name] = multi.includes(name) ? all : (all[0] ?? "");
  }
  for (const name of multi) out[name] ??= [];
  return out;
}

/** The first focusable control for a field name (a checkbox group focuses its first box). */
function controlFor(form: HTMLFormElement, name: string): HTMLElement | null {
  const item = form.elements.namedItem(name);
  if (item instanceof RadioNodeList) return (item[0] as HTMLElement | undefined) ?? null;
  return item instanceof HTMLElement ? item : null;
}

type PreviewFormProps = {
  id: string;
  validate: (values: Values) => Errors;
  /** Field names that hold several values (checkbox groups). */
  multi?: readonly string[];
  /** Message key (under "forms") for the submit button. */
  submitKey?: string;
  children: ReactNode;
  className?: string;
  "aria-labelledby"?: string;
};

export function PreviewForm({ id, validate, multi = [], submitKey = "submit", children, className, ...aria }: PreviewFormProps) {
  const t = useFormsT();
  const lang = useFallbackLang();
  const hydrated = useHydrated();
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [errors, setErrors] = useState<Errors>({});
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [fieldOrder, setFieldOrder] = useState<string[]>([]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // After a failed submit, move focus to the error summary so it is read out first.
  useEffect(() => {
    if (attempt > 0) summaryRef.current?.focus();
  }, [attempt]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form || status === "sending") return;
    const next = validate(readValues(form, multi));
    setErrors(next);
    setFieldOrder(Array.from(form.elements, (el) => (el as HTMLInputElement).name).filter(Boolean));
    if (Object.keys(next).length > 0) {
      setStatus("idle");
      setAttempt((n) => n + 1);
      return;
    }
    setStatus("sending");
    timer.current = window.setTimeout(() => setStatus("sent"), SEND_DELAY);
  };

  // Once a field shows an error, it is checked again as it changes, so the error clears as soon
  // as the value is right. Fields without an error are left alone until the next submit.
  const onChange = (e: FormEvent<HTMLFormElement>) => {
    const name = (e.target as HTMLInputElement).name;
    if (status === "sent") setStatus("idle");
    const form = formRef.current;
    if (!form || !name || !(name in errors)) return;
    const next = validate(readValues(form, multi));
    setErrors((prev) => {
      const copy = { ...prev };
      if (next[name]) copy[name] = next[name];
      else delete copy[name];
      return copy;
    });
  };

  // Error summary in the order the fields appear on the page (read at submit time).
  const errorNames = Object.keys(errors).sort((a, b) => fieldOrder.indexOf(a) - fieldOrder.indexOf(b));

  const focusField = (e: MouseEvent<HTMLAnchorElement>, name: string) => {
    e.preventDefault();
    const el = formRef.current ? controlFor(formRef.current, name) : null;
    el?.focus();
    el?.scrollIntoView({ block: "center" });
  };

  return (
    <Ctx.Provider value={{ formId: id, errors }}>
      <form
        ref={formRef}
        id={id}
        noValidate
        onSubmit={onSubmit}
        onChange={onChange}
        className={cn("grid gap-6", className)}
        {...aria}
      >
        {attempt > 0 && errorNames.length > 0 && (
          <div
            ref={summaryRef}
            tabIndex={-1}
            className="rounded-2xl border-2 border-error p-5 focus-visible:outline-offset-4"
          >
            <p className="body flex items-center gap-2 font-semibold" lang={lang("forms.errorSummary")}>
              <CircleAlert aria-hidden className="size-5 shrink-0 text-error" />
              {t("errorSummary", { count: errorNames.length })}
            </p>
            <ul className="mt-3 space-y-1">
              {errorNames.map((name) => (
                <li key={name}>
                  <a
                    href={`#${id}-${name}`}
                    onClick={(e) => focusField(e, name)}
                    className="body-sm inline-flex min-h-11 items-center text-error underline underline-offset-4"
                    lang={lang(`forms.${errors[name]}`)}
                  >
                    {t(errors[name], { max: maxFor(name) })}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {children}

        <div className="flex flex-col items-start gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            // Disabled until JavaScript runs: the form can never be submitted natively.
            disabled={!hydrated}
            aria-disabled={status === "sending" || undefined}
            lang={lang(`forms.${status === "sent" ? "previewTitle" : status === "sending" ? "sending" : submitKey}`)}
          >
            {status === "sending" ? (
              <>
                <LoaderCircle aria-hidden className="animate-spin motion-reduce:animate-none" />
                {t("sending")}
              </>
            ) : status === "sent" ? (
              <>
                <Check aria-hidden />
                {t("previewTitle")}
              </>
            ) : (
              t(submitKey)
            )}
          </Button>
          <p role="status" className="body-sm min-h-[1.5em] text-muted-foreground" lang={status === "sent" ? lang("forms.previewBody") : undefined}>
            {status === "sent" ? `${t("previewTitle")}. ${t("previewBody")}` : ""}
          </p>
          <p className="body-sm text-muted-foreground" lang={lang("forms.privacy")}>
            {t("privacy")}
          </p>
        </div>
      </form>
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

function useField(name: string, optional: boolean) {
  const { formId, errors } = useContext(Ctx);
  const t = useFormsT();
  const lang = useFallbackLang();
  const id = `${formId}-${name}`;
  const errorKey = errors[name];
  const hasHint = t.has(`fields.${name}.hint`);
  const describedBy = [hasHint && `${id}-hint`, errorKey && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return {
    id,
    name,
    optional,
    invalid: !!errorKey,
    describedBy,
    label: { text: t(`fields.${name}.label`), lang: lang(`forms.fields.${name}.label`) },
    optionalText: { text: t("optional"), lang: lang("forms.optional") },
    hint: hasHint ? { text: t(`fields.${name}.hint`), lang: lang(`forms.fields.${name}.hint`) } : null,
    error: errorKey ? { text: t(errorKey, { max: maxFor(name) }), lang: lang(`forms.${errorKey}`) } : null,
  };
}

type Field = ReturnType<typeof useField>;

function LabelText({ f }: { f: Field }) {
  return (
    <>
      <span lang={f.label.lang}>{f.label.text}</span>
      {f.optional && (
        <span className="font-normal text-muted-foreground" lang={f.optionalText.lang}>
          {" "}
          ({f.optionalText.text})
        </span>
      )}
    </>
  );
}

function HintAndError({ f }: { f: Field }) {
  return (
    <>
      {f.hint && (
        <p id={`${f.id}-hint`} className="body-sm text-muted-foreground" lang={f.hint.lang}>
          {f.hint.text}
        </p>
      )}
      {f.error && (
        <p id={`${f.id}-error`} className="body-sm flex items-start gap-1.5 font-medium text-error" lang={f.error.lang}>
          <CircleAlert aria-hidden className="mt-[0.2em] size-4 shrink-0" />
          {f.error.text}
        </p>
      )}
    </>
  );
}

function Shell({ f, className, children }: { f: Field; className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <label htmlFor={f.id} className="body font-semibold">
        <LabelText f={f} />
      </label>
      <HintAndError f={f} />
      {children}
    </div>
  );
}

/** Shared control style: 48px tall, readable on light surfaces, orange-red border on error. */
const control =
  "body block w-full rounded-xl border-[1.5px] border-input bg-background px-4 text-foreground transition-colors duration-150 aria-[invalid=true]:border-error aria-[invalid=true]:border-2 [@media(hover:hover)]:hover:border-foreground/70";

type TextFieldProps = {
  name: string;
  optional?: boolean;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  maxLength?: number;
  className?: string;
};

export function TextField({ name, optional = false, type = "text", autoComplete, inputMode, maxLength, className }: TextFieldProps) {
  const f = useField(name, optional);
  return (
    <Shell f={f} className={className}>
      <input
        id={f.id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        required={!optional}
        aria-invalid={f.invalid || undefined}
        aria-describedby={f.describedBy}
        spellCheck={type === "text" ? undefined : false}
        className={cn(control, "h-12")}
      />
    </Shell>
  );
}

export function TextAreaField({ name, optional = false, maxLength, className }: { name: string; optional?: boolean; maxLength?: number; className?: string }) {
  const f = useField(name, optional);
  return (
    <Shell f={f} className={className}>
      <textarea
        id={f.id}
        name={name}
        rows={5}
        maxLength={maxLength}
        required={!optional}
        autoComplete="off"
        aria-invalid={f.invalid || undefined}
        aria-describedby={f.describedBy}
        className={cn(control, "min-h-36 resize-y py-3")}
      />
    </Shell>
  );
}

export type Option = { value: string; label: string; lang?: string };
export type OptionGroup = { label: string; lang?: string; options: Option[] };

type SelectFieldProps = {
  name: string;
  optional?: boolean;
  /** The first, empty choice ("Choose one", "No preference"). */
  emptyLabel: { text: string; lang?: string };
  options?: Option[];
  groups?: OptionGroup[];
  defaultValue?: string;
  className?: string;
};

export function SelectField({ name, optional = false, emptyLabel, options, groups, defaultValue = "", className }: SelectFieldProps) {
  const f = useField(name, optional);
  const opt = (o: Option) => (
    <option key={o.value} value={o.value} lang={o.lang}>
      {o.label}
    </option>
  );
  return (
    <Shell f={f} className={className}>
      <div className="relative">
        <select
          id={f.id}
          name={name}
          defaultValue={defaultValue}
          required={!optional}
          autoComplete="off"
          aria-invalid={f.invalid || undefined}
          aria-describedby={f.describedBy}
          className={cn(control, "h-12 cursor-pointer appearance-none pe-11")}
        >
          <option value="" lang={emptyLabel.lang}>
            {emptyLabel.text}
          </option>
          {options?.map(opt)}
          {groups?.map((g) => (
            <optgroup key={g.label} label={g.label} lang={g.lang}>
              {g.options.map(opt)}
            </optgroup>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </Shell>
  );
}

/** A group of checkboxes drawn as chips (multi-select). Each chip is a 44px touch target. */
export function CheckboxChips({ name, options, optional = true, className }: { name: string; options: Option[]; optional?: boolean; className?: string }) {
  const f = useField(name, optional);
  return (
    <fieldset className={cn("grid gap-2", className)} aria-describedby={f.describedBy}>
      <legend className="body mb-2 font-semibold">
        <LabelText f={f} />
      </legend>
      <HintAndError f={f} />
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o, i) => (
          <label
            key={o.value}
            className="group body-sm inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-input px-4 font-medium transition-colors duration-150 select-none has-checked:border-primary has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-ring [@media(hover:hover)]:hover:border-foreground/70"
          >
            <input type="checkbox" name={name} value={o.value} id={i === 0 ? f.id : undefined} className="sr-only" />
            <Check aria-hidden className="hidden size-4 group-has-checked:block" />
            <span lang={o.lang}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
