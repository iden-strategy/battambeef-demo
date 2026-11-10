import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { JourneyScroller } from "@/components/farm-to-table/journey-scroller";
import type { JourneyVersion } from "@/components/farm-to-table/journey-version";
import { StageMedia } from "@/components/farm-to-table/stage-media";
import { ImageReveal } from "@/components/motion/image-reveal";
import { Reveal, RevealItem } from "@/components/motion/reveal";
import { getFallbackLang } from "@/i18n/get-fallback-lang";
import { getJourneyStages, type JourneyStage } from "@/lib/data";
import { cn } from "@/lib/utils";

type StageView = JourneyStage & {
  index: number;
  number: string;
  short: string;
  title: string;
  body: string;
  stageOf: string;
  goTo: string;
  lang: { short?: string; title?: string; body?: string; stageOf?: string; goTo?: string };
};

/**
 * The journey, in two versions rendered side by side; CSS shows one (globals.css, "Farm to
 * Table journey") and JourneyScroller animates it:
 * - desktop (≥1024px, motion allowed): progress rail | photo frame | stage text, held in place
 *   while you scroll through ~4 screen heights
 * - stacked (phones, portrait tablets, reduced motion, no JavaScript, and the failsafe when the
 *   desktop animation cannot load): five blocks and a slim sticky progress bar
 */
export async function Journey() {
  const t = await getTranslations("farmToTable.journey");
  const fallback = await getFallbackLang();
  const lang = (key: string) => fallback(`farmToTable.journey.${key}`);
  const raw = getJourneyStages();
  const total = raw.length;

  const stages: StageView[] = raw.map((s, index) => ({
    ...s,
    index,
    number: String(index + 1).padStart(2, "0"),
    short: t(`stages.${s.id}.short`),
    title: t(`stages.${s.id}.title`),
    body: t(`stages.${s.id}.body`),
    stageOf: t("stageOf", { n: index + 1, total }),
    goTo: t("goTo", { n: index + 1, name: t(`stages.${s.id}.title`) }),
    lang: {
      short: lang(`stages.${s.id}.short`),
      title: lang(`stages.${s.id}.title`),
      body: lang(`stages.${s.id}.body`),
      stageOf: lang("stageOf"),
      goTo: lang("goTo"),
    },
  }));

  const pending = { text: t("pendingNote"), lang: lang("pendingNote") };
  const soon = { text: t("photoSoon"), lang: lang("photoSoon") };
  const media = (s: StageView, version: JourneyVersion, sizes: string) => (
    <StageMedia
      image={s.image}
      number={s.number}
      name={s.title}
      nameLang={s.lang.title}
      soonLabel={soon.text}
      soonLang={soon.lang}
      version={version}
      sizes={sizes}
    />
  );

  return (
    <section id="journey" data-surface="dark" aria-labelledby="journey-heading">
      <h2 id="journey-heading" className="sr-only" lang={lang("heading")}>
        {t("heading")}
      </h2>
      <JourneyScroller>
        {/* Desktop: a 500svh track; the stage sticks for the last 400svh of it. Centred in the
            full screen height: the frame is capped at 67.5svh, so the margins above it are
            always taller than the header (which hides on scroll down and returns on scroll up). */}
        <div data-journey="desktop" className="journey-desktop">
          <div className="sticky top-0 flex h-[100svh] flex-col">
            <div className="container-page grid min-h-0 flex-1 grid-cols-[minmax(0,0.8fr)_auto_minmax(0,1fr)] items-center gap-[clamp(2rem,3.5vw,4.5rem)] py-[4svh]">
              {/* Progress rail */}
              <nav aria-label={t("label")} lang={lang("label")}>
                <p className="label text-label">{t("label")}</p>
                <ol className="relative mt-6 flex flex-col gap-[clamp(0.5rem,2.2svh,1.5rem)]">
                  <span aria-hidden className="absolute top-[1.375rem] bottom-[1.375rem] left-[calc(1.375rem-1px)] w-0.5 bg-border" />
                  <span
                    aria-hidden
                    data-rail-fill=""
                    className="absolute top-[1.375rem] bottom-[1.375rem] left-[calc(1.375rem-1.5px)] w-[3px] origin-top rounded-full bg-primary [transform:scaleY(0)]"
                  />
                  {stages.map((s) => (
                    <li key={s.id} className="relative">
                      <button
                        type="button"
                        data-rail-step={s.index}
                        data-state={s.index === 0 ? "active" : "todo"}
                        aria-current={s.index === 0 ? "step" : undefined}
                        aria-label={s.goTo}
                        lang={s.lang.goTo}
                        className="group flex min-h-11 cursor-pointer items-center gap-4 rounded-full pe-3 text-start"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "tabular grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-border bg-background font-display text-sm font-bold text-muted-foreground",
                            "transition-[background-color,border-color,color] duration-300",
                            "group-data-[state=done]:border-primary group-data-[state=done]:text-foreground",
                            "group-data-[state=active]:border-primary group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground",
                          )}
                        >
                          {s.number}
                        </span>
                        <span
                          aria-hidden
                          lang={s.lang.short}
                          className="font-display text-base font-bold text-muted-foreground transition-colors duration-300 group-data-[state=active]:text-foreground xl:text-lg"
                        >
                          {s.short}
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>

              {/* Photo frame: each stage's photo wipes up over the previous one. Only the stage
                  on screen is exposed to screen readers (JourneyPinned keeps aria-hidden in step). */}
              <div className="relative aspect-[4/5] w-[min(36vw,54svh)] overflow-hidden rounded-2xl bg-card">
                {stages.map((s) => (
                  <div key={s.id} data-layer="" aria-hidden={s.index > 0 || undefined} className="absolute inset-0 overflow-hidden">
                    <div data-layer-inner="" className="absolute inset-0">
                      {media(s, "desktop", "(min-width: 1024px) 36vw, 1px")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stage text: all five share one grid cell, so the tallest sets the height. */}
              <div className="grid">
                {stages.map((s) => (
                  <article key={s.id} data-panel="" aria-hidden={s.index > 0 || undefined} className="[grid-area:1/1] self-center">
                    <StageText stage={s} pending={pending} titleClass="title-lg [--fs:clamp(1.75rem,0.5rem+2.5vw,3.5rem)]" />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stacked: phones, portrait tablets, reduced motion, no JavaScript and the failsafe. */}
        <div data-journey="stacked" className="journey-stacked">
          <div
            aria-hidden
            className="journey-bar sticky top-[calc(var(--header-h)+env(safe-area-inset-top))] z-20 border-b border-border bg-background"
          >
            <div className="container-page flex h-11 items-center gap-4">
              <div className="grid shrink-0">
                {stages.map((s) => (
                  <span
                    key={s.id}
                    data-bar-label=""
                    data-current={s.index === 0 ? "" : undefined}
                    className="label invisible [grid-area:1/1] text-label data-[current]:visible"
                  >
                    <span lang={s.lang.stageOf}>{s.stageOf}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span lang={s.lang.short} className="text-foreground">
                      {s.short}
                    </span>
                  </span>
                ))}
              </div>
              <div className="ms-auto flex max-w-48 flex-1 gap-1">
                {stages.map((s) => (
                  <span key={s.id} className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/15">
                    {/* A plain transform (not Tailwind's scale-x-0, which uses the separate CSS
                        `scale` property) so the script's transform is the only scale applied. */}
                    <span data-seg-fill="" className="absolute inset-0 origin-left bg-primary [transform:scaleX(0)]" />
                  </span>
                ))}
              </div>
            </div>
          </div>

          <ol className="container-page">
            {stages.map((s) => (
              <li
                key={s.id}
                data-block=""
                className="grid gap-7 border-border py-12 not-first:border-t sm:grid-cols-2 sm:items-center sm:gap-10 md:py-16 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16"
              >
                <ImageReveal className="aspect-[4/5] w-full rounded-2xl bg-card">
                  {media(s, "stacked", "(min-width: 640px) 50vw, 100vw")}
                </ImageReveal>
                <Reveal stagger={0.08}>
                  <StageText stage={s} pending={pending} titleClass="title-lg max-w-[16ch]" item />
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </JourneyScroller>
    </section>
  );
}

type StageTextProps = {
  stage: StageView;
  pending: { text: string; lang?: string };
  titleClass: string;
  /** Wrap each line in a RevealItem (stacked version, staggered in by its Reveal parent). */
  item?: boolean;
};

function StageText({ stage: s, pending, titleClass, item = false }: StageTextProps) {
  const Line = item ? RevealItem : "div";
  return (
    <>
      <Line>
        <p className="label text-label" lang={s.lang.stageOf}>
          {s.stageOf}
        </p>
      </Line>
      <Line>
        <h3 className={cn(titleClass, "mt-4 text-balance")} lang={s.lang.title}>
          {s.title}
        </h3>
      </Line>
      <Line>
        <p className="body-lg mt-5 max-w-[34ch] text-muted-foreground" lang={s.lang.body}>
          {s.body}
        </p>
      </Line>
      {s.pendingNote && (
        <Line>
          <p className="label mt-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-muted-foreground" lang={pending.lang}>
            <Info aria-hidden className="size-3.5 shrink-0 text-label" />
            {pending.text}
          </p>
        </Line>
      )}
    </>
  );
}
