import type { ReactNode } from "react";
import { SplitTextReveal } from "@/components/motion/split-text-reveal";
import type { Text } from "@/components/page-hero";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** id of the heading, for the section's aria-labelledby. */
  id: string;
  label: Text;
  title: Text;
  body?: Text;
  /** A link or button beside the heading from 1024px (below it on smaller screens). */
  action?: ReactNode;
  className?: string;
  titleClassName?: string;
};

/** Label, section title (title-lg, SplitTextReveal) and optional intro: the same on every page. */
export function SectionHeading({ id, label, title, body, action, className, titleClassName }: SectionHeadingProps) {
  return (
    <div className={cn("grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end", className)}>
      <div>
        <p className="label text-label" lang={label.lang}>
          {label.text}
        </p>
        <SplitTextReveal
          as="h2"
          id={id}
          text={title.text}
          lang={title.lang}
          className={cn("title-lg mt-3 max-w-[18ch] text-balance", titleClassName)}
        />
        {body && (
          <p className="body-lg mt-4 max-w-2xl text-muted-foreground" lang={body.lang}>
            {body.text}
          </p>
        )}
      </div>
      {action && <div className="justify-self-start">{action}</div>}
    </div>
  );
}
