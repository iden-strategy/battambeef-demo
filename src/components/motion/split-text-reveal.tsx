import type { CSSProperties, ReactNode } from "react";
import { SplitInView } from "@/components/motion/split-in-view";
import { cn } from "@/lib/utils";

const KHMER_RE = /[ក-៿᧠-᧿]/;

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

/**
 * A piece of a mixed line (`text` as an array):
 * - a plain string, split like `text`
 * - `{ text, className }`: a styled run (e.g. a kraft highlight), still split and animated
 * - `{ node }`: an element between words (e.g. an InlinePill). Hidden from screen readers.
 * - `{ br: true, className }`: a line break; give it a class like "max-md:hidden" to break only
 *   on some screens (put the space before it in the preceding string)
 */
export type SplitPart = string | { text: string; className?: string } | { node: ReactNode } | { br: true; className?: string };

export type SplitTextRevealProps = {
  text: string | SplitPart[];
  as?: Tag;
  className?: string;
  /** For the heading element itself (e.g. to link to it, or to move focus to it). */
  id?: string;
  /** -1 makes the heading focusable by script only (focus moves here, it is not a Tab stop). */
  tabIndex?: -1;
  /** Language of the text. Auto-detected (Khmer script → "km") when omitted. */
  lang?: string;
  /** Seconds between pieces. Defaults: 0.035 for letters, 0.08 for Khmer words. */
  stagger?: number;
  delay?: number;
  /** Duration of each piece's rise, in seconds. */
  duration?: number;
  /** How far each piece rises from, as a CSS length. Default 0.6em. */
  rise?: string;
  /** Each piece starts tilted by this many degrees (pivoting on its bottom-left corner). */
  tilt?: number;
  /** Characters drawn in the accent colour (`.split-accent`), e.g. "." for a crimson full stop. */
  accent?: string;
  /**
   * "inView" plays when 50% visible (Motion, after hydration).
   * "mount" plays from the first paint with CSS (hero headings): never waits for JavaScript.
   */
  trigger?: "inView" | "mount";
  amount?: number;
  once?: boolean;
};

type Piece = { text: string; space: boolean };

function splitKhmer(text: string): Piece[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("km", { granularity: "word" });
    return Array.from(segmenter.segment(text), (s) => ({ text: s.segment, space: /^\s+$/.test(s.segment) }));
  }
  return splitWords(text);
}

function splitWords(text: string): Piece[] {
  return text.split(/(\s+)/).filter(Boolean).map((t) => ({ text: t, space: /^\s+$/.test(t) }));
}

const plainText = (parts: SplitPart[]) =>
  parts.map((p) => (typeof p === "string" ? p : "text" in p ? p.text : "")).join("");

/**
 * Letters (English) or words (Khmer) rise from 0.6em below and fade in.
 * - desktop (fine pointer): adds an 8px → 0 blur
 * - touch: fade + rise only
 * - reduced motion: the whole line fades in quickly, nothing moves
 * Screen readers get the plain text once; the animated pieces are aria-hidden.
 *
 * The text is split here, during the server render, and sent to the browser as HTML, so the
 * server's and the browser's Khmer word breaks can never disagree. Use it from server
 * components; inside a client component, pass it in as `children` from a server component.
 */
export function SplitTextReveal({
  text,
  as: Tag = "span",
  className,
  id,
  tabIndex,
  lang,
  stagger,
  delay = 0,
  duration = 0.9,
  rise = "0.6em",
  tilt = 0,
  accent,
  trigger = "inView",
  amount = 0.5,
  once = true,
}: SplitTextRevealProps) {
  const parts: SplitPart[] = typeof text === "string" ? [text] : text;
  const fullText = plainText(parts);
  const isKhmer = lang ? lang.startsWith("km") : KHMER_RE.test(fullText);
  const resolvedLang = lang ?? (isKhmer ? "km" : undefined);
  const step = stagger ?? (isKhmer ? 0.08 : 0.035);
  const isAccent = (ch: string) => !!accent && accent.includes(ch);

  let i = 0;
  const pieceEl = (content: ReactNode, key: number, pieceClass?: string) => (
    <span
      key={key}
      data-piece=""
      className={cn("inline-block", tilt !== 0 && "origin-bottom-left", pieceClass)}
      style={{ "--i": i++ } as CSSProperties}
    >
      {content}
    </span>
  );

  const splitRun = (run: string): ReactNode[] =>
    (isKhmer ? splitKhmer(run) : splitWords(run)).map((p, k) => {
      if (p.space) return <span key={k}>{p.text}</span>;
      if (isKhmer) {
        // A trailing accent character (e.g. the Khmer full stop ។) gets the accent colour.
        const last = p.text.slice(-1);
        const content =
          p.text.length > 1 && isAccent(last) ? (
            <>
              {p.text.slice(0, -1)}
              <span className="split-accent">{last}</span>
            </>
          ) : (
            p.text
          );
        return pieceEl(content, k, p.text.length === 1 && isAccent(last) ? "split-accent" : undefined);
      }
      // Letters are grouped per word so lines never break inside a word.
      return (
        <span key={k} data-word="" className="inline-block whitespace-nowrap">
          {Array.from(p.text).map((ch, j) => pieceEl(ch, j, isAccent(ch) ? "split-accent" : undefined))}
        </span>
      );
    });

  const pieces: ReactNode[] = parts.map((part, k) => {
    if (typeof part === "string") return <span key={k}>{splitRun(part)}</span>;
    if ("br" in part) return <br key={k} className={part.className} />;
    if ("node" in part) return <span key={k}>{part.node}</span>;
    return (
      <span key={k} className={part.className}>
        {splitRun(part.text)}
      </span>
    );
  });

  const motionVars = {
    "--reveal-y": rise,
    "--reveal-rotate": `${tilt}deg`,
  } as CSSProperties;

  return (
    <Tag className={className} lang={resolvedLang} id={id} tabIndex={tabIndex}>
      <span className="sr-only">{fullText}</span>
      {trigger === "mount" ? (
        <span
          aria-hidden
          className="split-mount inline"
          style={
            {
              ...motionVars,
              "--reveal-delay": `${delay}s`,
              "--reveal-step": `${step}s`,
              "--reveal-dur": `${duration}s`,
            } as CSSProperties
          }
        >
          {pieces}
        </span>
      ) : (
        <SplitInView step={step} delay={delay} duration={duration} amount={amount} once={once} rise={rise} tilt={tilt}>
          {pieces}
        </SplitInView>
      )}
    </Tag>
  );
}
