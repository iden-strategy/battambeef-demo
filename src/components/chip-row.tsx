"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useMotionPrefs } from "@/components/motion/use-motion-prefs";
import { cn } from "@/lib/utils";

export type ChipItem<T extends string> = {
  id: T;
  label: string;
  /** Small tabular prefix, e.g. the part number. */
  prefix?: string | number;
  lang?: "en";
};

type ChipRowProps<T extends string> = {
  items: ChipItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
};

/**
 * A row of toggle chips with a roving tabindex: Tab enters at the selected chip, arrow keys
 * (and Home/End) move focus, Enter or Space selects. 44px tall; scrolls sideways inside its own
 * box on small screens, never the page.  From 768px up the chips wrap instead. Used for the cut map parts and the grid filters.
 */
export function ChipRow<T extends string>({ items, value, onChange, label }: ChipRowProps<T>) {
  const rowRef = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const { reduced } = useMotionPrefs();
  const selectedIdx = Math.max(0, items.findIndex((c) => c.id === value));

  // Keep the selected chip in view when it changed from elsewhere (the map). Scrolls the row only.
  useEffect(() => {
    const row = rowRef.current;
    const chip = refs.current[selectedIdx];
    if (!row || !chip) return;
    // Position of the chip inside the row's scrolled content, from bounding boxes (offsetLeft would
    // be measured from whichever ancestor is positioned, not from this row).
    const chipLeft = chip.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft;
    const left = chipLeft - (row.clientWidth - chip.offsetWidth) / 2;
    const max = row.scrollWidth - row.clientWidth;
    row.scrollTo({ left: Math.min(Math.max(0, left), max), behavior: reduced ? "auto" : "smooth" });
  }, [selectedIdx, reduced]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = focusIdx ?? selectedIdx;
    let to = from;
    if (e.key === "ArrowRight") to = (from + 1) % items.length;
    else if (e.key === "ArrowLeft") to = (from - 1 + items.length) % items.length;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = items.length - 1;
    else return;
    e.preventDefault();
    refs.current[to]?.focus();
  };

  return (
    <div
      ref={rowRef}
      role="group"
      aria-label={label}
      onKeyDown={onKeyDown}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusIdx(null);
      }}
      className="flex gap-2 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            aria-pressed={selected}
            tabIndex={(focusIdx ?? selectedIdx) === i ? 0 : -1}
            onFocus={() => setFocusIdx(i)}
            onClick={() => onChange(item.id)}
            lang={item.lang}
            className={cn(
              "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-[0.9375rem] font-semibold whitespace-nowrap transition-transform duration-150 select-none active:scale-[0.97]",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-transparent text-foreground hover:border-foreground",
            )}
          >
            {item.prefix !== undefined && <span className="tabular text-xs opacity-80">{item.prefix}</span>}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
