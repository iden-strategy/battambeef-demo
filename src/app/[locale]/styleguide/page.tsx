import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  CountUp,
  cursorTarget,
  DragCarousel,
  ImageReveal,
  InlinePill,
  MagneticButton,
  Marquee,
  ParallaxImage,
  Reveal,
  RevealItem,
  SplitTextReveal,
  TiltCard,
} from "@/components/motion";
import { SplitDemo } from "@/components/styleguide/split-demo";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/metadata";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { Link } from "@/i18n/navigation";
import { getBrandColors, getCowMap, getCuts } from "@/lib/data";
import { cn, contrastRatio } from "@/lib/utils";

// Internal page: 404 on the production deployment, available locally and on preview deployments.
const HIDDEN = process.env.VERCEL_ENV === "production";

// No robots override: the page inherits the layout's full noindex/nofollow metadata.
export const generateMetadata = () => pageMetadata("styleguide");

const SECTION = "section";
// Consecutive dark sections are separated by a hairline.
const DARK_SECTION = cn(SECTION, "border-t border-border");

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-10 md:mb-14">
      {eyebrow && <p className="label text-label">{eyebrow}</p>}
      <h2 className="title-lg mt-3">{title}</h2>
    </div>
  );
}

function DemoBlock({ title, hint, children, className }: { title: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border p-5 md:p-8", className)}>
      <h3 className="label text-label">{title}</h3>
      {hint && <p className="body-sm mt-2 text-muted-foreground">{hint}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

const VARIANTS = ["default", "outline", "ghost", "link"] as const;
const STATES = ["default", "hover", "focus", "pressed", "disabled"] as const;
const STATE_PROPS: Record<(typeof STATES)[number], Record<string, unknown>> = {
  default: {},
  hover: { "data-state": "hover" },
  focus: { className: "outline-2 outline-offset-[3px] outline-ring outline-solid" },
  pressed: { "data-state": "pressed" },
  disabled: { disabled: true },
};

function ButtonMatrix({
  variants,
  states,
}: {
  variants: Record<(typeof VARIANTS)[number], string>;
  states: Record<(typeof STATES)[number], string>;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2">
      <table className="w-full min-w-[640px] border-separate border-spacing-y-3 text-start">
        <thead>
          <tr>
            <th className="w-28" />
            {STATES.map((s) => (
              <th key={s} scope="col" className="label pb-2 text-start font-semibold text-muted-foreground">
                {states[s]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VARIANTS.map((v) => (
            <tr key={v}>
              <th scope="row" className="body-sm pe-4 text-start font-semibold">
                {variants[v]}
              </th>
              {STATES.map((s) => (
                <td key={s} className="pe-3">
                  <Button variant={v} size="sm" tabIndex={-1} {...STATE_PROPS[s]}>
                    {variants[v]}
                  </Button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function StyleguidePage() {
  if (HIDDEN) notFound();

  const t = await getTranslations("styleguide");
  const fallback = await getFallbackLang();
  // The styleguide is untranslated: in /km its sections are English (Khmer samples say so too).
  const lang = fallback("styleguide.title");
  const colors = getBrandColors();
  const cuts = getCuts();
  const { image } = getCowMap();
  const km = (id: string) => cuts.find((c) => c.id === id)?.nameKm ?? "";
  const kmList = cuts
    .slice(0, 9)
    .map((c) => c.nameKm)
    .filter(Boolean)
    .join(" · ");
  const placeholderAlt = t("kit.placeholderImage");

  const W = "#F5F3EF";
  const C = "#292B2D";
  const K = "#C5A77D";
  const CRIMSON = "#7B1E2B";
  const STEEL = "#B9BEC2";
  const ratio = (fg: string, bg: string) => `${contrastRatio(fg, bg).toFixed(1)}:1`;

  type Swatch = { name: string; fg: string; cls: string; status: "ok" | "large" | "no" };
  const surfaces: { key: "dark" | "light" | "kraft"; bg: string; rows: Swatch[] }[] = [
    {
      key: "dark",
      bg: C,
      rows: [
        { name: t("surfaces.main"), fg: W, cls: "text-foreground", status: "ok" },
        { name: t("surfaces.muted"), fg: STEEL, cls: "text-muted-foreground", status: "ok" },
        { name: t("surfaces.accent"), fg: K, cls: "text-accent-text", status: "ok" },
        { name: t("surfaces.link"), fg: K, cls: "text-link underline", status: "ok" },
        { name: t("surfaces.success"), fg: "#8FD19E", cls: "text-success", status: "ok" },
        { name: t("surfaces.error"), fg: "#FFA070", cls: "text-error", status: "ok" },
        { name: t("surfaces.crimsonOnCharcoal"), fg: CRIMSON, cls: "text-brand-crimson", status: "no" },
      ],
    },
    {
      key: "light",
      bg: W,
      rows: [
        { name: t("surfaces.main"), fg: C, cls: "text-foreground", status: "ok" },
        { name: t("surfaces.muted"), fg: "#55585B", cls: "text-muted-foreground", status: "ok" },
        { name: t("surfaces.accent"), fg: CRIMSON, cls: "text-accent-text", status: "ok" },
        { name: t("surfaces.link"), fg: CRIMSON, cls: "text-link underline", status: "ok" },
        { name: t("surfaces.success"), fg: "#2E6B3A", cls: "text-success", status: "ok" },
        { name: t("surfaces.error"), fg: "#A63D00", cls: "text-error", status: "ok" },
        { name: t("surfaces.kraftOnWhite"), fg: K, cls: "text-brand-kraft", status: "no" },
        { name: t("surfaces.steelOnWhite"), fg: STEEL, cls: "text-brand-steel", status: "no" },
      ],
    },
    {
      key: "kraft",
      bg: K,
      rows: [
        { name: t("surfaces.main"), fg: C, cls: "text-foreground", status: "ok" },
        { name: t("surfaces.muted"), fg: "#3B3D3F", cls: "text-muted-foreground", status: "ok" },
        { name: t("surfaces.label"), fg: C, cls: "text-label", status: "ok" },
        { name: t("surfaces.link"), fg: C, cls: "text-link underline", status: "ok" },
        { name: t("surfaces.accent"), fg: CRIMSON, cls: "text-accent-text", status: "large" },
        { name: t("surfaces.success"), fg: "#1A4322", cls: "text-success", status: "ok" },
        { name: t("surfaces.error"), fg: "#6B2600", cls: "text-error", status: "ok" },
      ],
    },
  ];

  const typeRows: { cls: string; en: string; km: string }[] = [
    { cls: "display-hero", en: t("type.sampleHero"), km: km("ribeye") },
    { cls: "display-xl", en: t("type.sampleXl"), km: km("tenderloin") },
    { cls: "title-lg", en: t("type.sampleTitle"), km: `${km("striploin")} ${km("rump")}` },
    { cls: "title-md", en: t("type.sampleTitle"), km: `${km("brisket")} ${km("topside")} ${km("thin-flank")}` },
    { cls: "label", en: t("type.sampleLabel"), km: `2243 · ${km("ribeye")}` },
    { cls: "body-lg", en: t("type.sampleBody"), km: kmList },
    { cls: "body", en: t("type.sampleBody"), km: kmList },
    { cls: "body-sm", en: t("type.sampleBody"), km: kmList },
  ];

  const matrix = {
    variants: { default: t("buttons.primary"), outline: t("buttons.outline"), ghost: t("buttons.ghost"), link: t("buttons.link") },
    states: {
      default: t("buttons.default"),
      hover: t("buttons.hover"),
      focus: t("buttons.focus"),
      pressed: t("buttons.pressed"),
      disabled: t("buttons.disabled"),
    },
  };

  return (
    <>
      {/* Intro: the dark default, so the header starts transparent */}
      <section lang={lang} data-surface="dark" className="pt-[calc(var(--header-h)+env(safe-area-inset-top)+4rem)] pb-16 md:pb-24">
        <div className="container-page">
          <p className="label text-label">{t("eyebrow")}</p>
          <h1 className="display-hero mt-4">{t("title")}</h1>
          <p className="body-lg mt-6 max-w-2xl text-muted-foreground">{t("intro")}</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {(["colors", "type", "buttons", "kit"] as const).map((s) => (
              <li key={s}>
                <a href={`#${s}`} className="label inline-flex min-h-11 items-center rounded-full border border-border px-4 hover:border-current">
                  {t(`sections.${s}`)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Colours + surfaces */}
      <section id="colors" lang={lang} data-surface="dark" className={DARK_SECTION}>
        <div className="container-page">
          <SectionTitle title={t("sections.colors")} />
          <ul className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4">
            {colors.map((c) => (
              <li key={c.key} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="h-24 border-b border-border" style={{ backgroundColor: c.hex }} />
                <div className="p-4">
                  <p className="body-sm font-semibold">{c.token}</p>
                  <p className="label tabular mt-1 text-muted-foreground">{c.hex}</p>
                  <p className="body-sm mt-2 text-muted-foreground">{t(`colors.${c.key}`)}</p>
                </div>
              </li>
            ))}
          </ul>

          <h2 className="title-md mt-20 mb-8">{t("sections.surfaces")}</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {surfaces.map((s) => (
              <div key={s.key} data-surface={s.key} className="rounded-2xl border border-border p-6">
                <p className="label text-label">{t(`surfaces.${s.key}`)}</p>
                <p className="title-md mt-3">{t("surfaces.sample")}</p>
                <ul className="mt-6 space-y-3">
                  {s.rows.map((r) => (
                    <li key={r.name} className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
                      <span className={cn("body font-medium", r.cls, r.status === "no" && "line-through")}>{r.name}</span>
                      <span className="label tabular shrink-0">
                        {ratio(r.fg, s.bg)} ·{" "}
                        {r.status === "ok" ? t("surfaces.allowed") : r.status === "large" ? t("surfaces.largeOnly") : t("surfaces.notAllowed")}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button size="sm">{t("buttons.primary")}</Button>
                  <Button size="sm" variant="outline">
                    {t("buttons.outline")}
                  </Button>
                  <Button size="sm" variant="link">
                    {t("buttons.link")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Typography */}
      <section id="type" lang={lang} data-surface="dark" className={DARK_SECTION}>
        <div className="container-page">
          <SectionTitle title={t("sections.type")} />
          <p className="body-sm -mt-6 mb-10 text-muted-foreground">{t("type.khmerSource")}</p>
          <div className="space-y-14">
            {typeRows.map((row) => (
              <div key={row.cls} className="grid gap-6 border-t border-border pt-6 lg:grid-cols-2 lg:gap-10">
                <div className="min-w-0">
                  <p className="label mb-3 text-muted-foreground">
                    .{row.cls} · {t("type.english")}
                  </p>
                  <p className={cn(row.cls, "break-words")}>{row.en}</p>
                </div>
                <div className="min-w-0" lang="km">
                  <p className="label mb-3 text-muted-foreground" lang="en">
                    .{row.cls} · {t("type.khmer")}
                  </p>
                  <p className={cn(row.cls, "break-words")}>{row.km}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buttons: the dark default, then each accent surface */}
      <section id="buttons" lang={lang} data-surface="dark" className={DARK_SECTION}>
        <div className="container-page">
          <SectionTitle title={t("sections.buttons")} />
          <ButtonMatrix {...matrix} />
          {(["light", "kraft"] as const).map((s) => (
            <div key={s} data-surface={s} className="mt-10 rounded-2xl p-5 md:p-8">
              <p className="label mb-4 text-label">{t(s === "light" ? "buttons.onLight" : "buttons.onKraft")}</p>
              <ButtonMatrix {...matrix} />
            </div>
          ))}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <p className="label text-label">{t("buttons.magnetic")}</p>
            <MagneticButton>
              <Button>{t("buttons.primary")}</Button>
            </MagneticButton>
            <MagneticButton>
              <Button variant="outline">{t("buttons.outline")}</Button>
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* Kit, part 1: dark */}
      <section id="kit" lang={lang} data-surface="dark" className={DARK_SECTION}>
        <div className="container-page">
          <SectionTitle eyebrow={t("sections.kit")} title={t("kit.splitTitle")} />
          <SplitDemo replayLabel={t("kit.replay")}>
            <SplitTextReveal as="p" text={t("kit.splitEn")} className="display-xl" />
            <SplitTextReveal as="p" text={`${km("ribeye")} ${km("striploin")} ${km("tenderloin")}`} lang="km" className="display-xl" />
          </SplitDemo>
        </div>

        <div className="mt-20">
          <div className="container-page">
            <h3 className="label text-label">{t("kit.carouselTitle")}</h3>
            <p className="body-sm mt-2 text-muted-foreground">{t("kit.carouselHint")}</p>
          </div>
          <DragCarousel className="mt-6">
            {Array.from({ length: 6 }, (_, i) => (
              <article key={i} className="flex aspect-[4/5] flex-col justify-between rounded-2xl bg-card p-6 md:aspect-[5/4]" {...cursorTarget("view")}>
                <p className="label tabular text-label">{String(i + 1).padStart(2, "0")}</p>
                <div>
                  <p className="title-md">{t("kit.card", { n: i + 1 })}</p>
                  <p className="body-sm mt-2 text-muted-foreground">{t("kit.cardBody")}</p>
                  <Button asChild variant="link" size="sm" className="mt-3">
                    <Link href="/beef-cuts">{t("kit.cardCta")}</Link>
                  </Button>
                </div>
              </article>
            ))}
          </DragCarousel>
        </div>

        <div className="container-page mt-20 grid gap-6 lg:grid-cols-2">
          <DemoBlock title={t("kit.tiltTitle")} hint={t("kit.tiltBody")}>
            <TiltCard className="rounded-2xl bg-card">
              <div className="relative aspect-[4/3]">
                <ImageReveal src={image.src} alt={placeholderAlt} sizes="(min-width: 1024px) 40vw, 90vw" className="absolute inset-0" />
              </div>
              <div className="p-5">
                <p className="label text-label">2243</p>
                <p className="title-md mt-2" lang="km">
                  {km("ribeye")}
                </p>
              </div>
            </TiltCard>
          </DemoBlock>
          <DemoBlock title={t("kit.cursorTitle")} hint={t("kit.cursorHint")}>
            <div className="grid grid-cols-1 gap-3 xs:grid-cols-3">
              {(["drag", "explore", "view"] as const).map((c) => (
                <div key={c} {...cursorTarget(c)} className="flex aspect-square items-center justify-center rounded-xl bg-card">
                  <code className="label normal-case">{c}</code>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h3 className="label text-label">{t("kit.magneticTitle")}</h3>
              <div className="mt-4">
                <MagneticButton>
                  <Button>{t("buttons.magnetic")}</Button>
                </MagneticButton>
              </div>
            </div>
          </DemoBlock>
        </div>
      </section>

      {/* Kit, part 2: the page's light "breathing" section */}
      <section lang={lang} data-surface="light" className={SECTION}>
        <div className="container-page space-y-6">
          <DemoBlock title={t("kit.pillTitle")}>
            <p className="title-lg max-w-[22ch]">
              {t("kit.pillBefore")}
              <InlinePill src={image.src} objectPosition="70% 40%" />
              {t("kit.pillMiddle")}
              <InlinePill src={image.src} objectPosition="20% 30%" delay={0.15} />
              {t("kit.pillAfter")}
            </p>
          </DemoBlock>

          <DemoBlock title={t("kit.revealTitle")}>
            <Reveal stagger={0.1} className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <RevealItem key={i} className="flex aspect-[4/3] items-end rounded-xl bg-card p-4">
                  <span className="label">{t("kit.revealItem", { n: i + 1 })}</span>
                </RevealItem>
              ))}
            </Reveal>
          </DemoBlock>

          <div className="grid gap-6 lg:grid-cols-2">
            <DemoBlock title={t("kit.imageRevealTitle")} hint={placeholderAlt}>
              <ImageReveal src={image.src} alt={placeholderAlt} sizes="(min-width: 1024px) 45vw, 90vw" className="aspect-[3/2] rounded-xl" />
            </DemoBlock>
            <DemoBlock title={t("kit.parallaxTitle")} hint={placeholderAlt}>
              <ParallaxImage src={image.src} alt={placeholderAlt} sizes="(min-width: 1024px) 45vw, 90vw" className="aspect-[3/2] rounded-xl" />
            </DemoBlock>
          </div>

          <DemoBlock title={t("kit.transitionTitle")} hint={t("kit.transitionHint")}>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/about">/about</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/beef-cuts">/beef-cuts</Link>
              </Button>
            </div>
          </DemoBlock>
        </div>
      </section>

      {/* Kit, part 3: kraft (the page's one kraft section) */}
      <section lang={lang} data-surface="kraft" className="section-sm">
        <div className="container-page">
          <h3 className="label text-label">{t("kit.marqueeTitle")}</h3>
        </div>
        <Marquee items={t("kit.marqueeItems").split("|")} className="mt-6 py-2" itemClassName="title-lg" />
        <div className="container-page mt-16">
          <h3 className="label text-label">{t("kit.countTitle")}</h3>
          <p className="mt-4 flex items-baseline gap-4">
            <CountUp to={72} className="display-hero" />
            <span className="title-md">{t("kit.countLabel")}</span>
          </p>
        </div>
      </section>
    </>
  );
}
