import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { SplitTextReveal } from "@/components/motion/split-text-reveal";
import { cn } from "@/lib/utils";

/** A translated string and its language marker ("en" when it fell back on a Khmer page). */
export type Text = { text: string; lang?: string };

type PageHeroProps = {
  label: Text;
  title: Text;
  body?: Text;
  /** Buttons under the intro. */
  actions?: ReactNode;
  /** Full-width content after the text, inside the same band (e.g. the About landscape). */
  after?: ReactNode;
  titleClassName?: string;
  className?: string;
};

/**
 * The opening band of the inner pages (dark): label, a big SplitTextReveal title and a short
 * intro. Above the fold, so everything reveals with CSS from the first paint and is readable
 * without JavaScript (CLAUDE.md section 8).
 */
export function PageHero({ label, title, body, actions, after, titleClassName, className }: PageHeroProps) {
  return (
    <section
      data-surface="dark"
      className={cn("pt-[calc(var(--header-h)+env(safe-area-inset-top)+3rem)] pb-14 md:pb-20", className)}
    >
      <div className="container-page">
        <Reveal trigger="mount">
          <p className="label text-label" lang={label.lang}>
            {label.text}
          </p>
        </Reveal>
        <SplitTextReveal
          as="h1"
          text={title.text}
          lang={title.lang}
          trigger="mount"
          delay={0.1}
          accent="."
          className={cn("display-xl mt-5 max-w-[15ch] text-balance", titleClassName)}
        />
        {(body || actions) && (
          <Reveal trigger="mount" delay={0.35}>
            {body && (
              <p className="body-lg mt-6 max-w-2xl text-muted-foreground" lang={body.lang}>
                {body.text}
              </p>
            )}
            {actions && <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10">{actions}</div>}
          </Reveal>
        )}
      </div>
      {after}
    </section>
  );
}
