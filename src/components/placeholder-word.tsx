import type { CSSProperties } from "react";

/**
 * Big type on a photo placeholder (cut name, cooking method, place name). Its size is capped by
 * the width of the placeholder box, so the longest word always fits: the box needs the
 * `placeholder-fit` class (a size container), and --fit-chars carries the longest word's length
 * (globals.css: .placeholder-word--card / --recipe).
 * Decorative: hidden from screen readers (the real name is in the card's heading).
 */
export function PlaceholderWord({
  text,
  lang,
  variant,
  className,
}: {
  text: string;
  lang?: string;
  variant: "card" | "recipe";
  className?: string;
}) {
  const longest = Math.max(4, ...text.split(/\s+/).map((w) => Array.from(w).length));
  return (
    <span
      aria-hidden
      lang={lang}
      // Plain join, not cn(): tailwind-merge reads `placeholder-word…` as Tailwind's placeholder
      // colour utility and would keep only one of the two classes.
      className={["placeholder-word", `placeholder-word--${variant}`, className].filter(Boolean).join(" ")}
      style={{ "--fit-chars": longest } as CSSProperties}
    >
      {text}
    </span>
  );
}
