"use client";

import { useRef } from "react";
import { CountUp } from "@/components/motion/count-up";

type ChillDialProps = {
  hours: number;
  /** "hours chilled" */
  unit: string;
  unitLang?: string;
};

const SIZE = 400;
const C = SIZE / 2;
const OUTER = 192;
/** Every 6th tick (each 6 hours) is longer, like the hour marks on a clock. */
const MAJOR_EVERY = 6;
/** Hour numbers printed inside the ring. */
const MARKS = [0, 24, 48];

function polar(r: number, i: number, count: number) {
  const a = (i / count) * Math.PI * 2 - Math.PI / 2; // 0 at the top, clockwise
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

/**
 * The 72-hour dial: one tick per hour. As the CountUp in the centre runs from 0 to 72, the
 * ticks light up crimson in step with it (opacity only). Reduced motion: CountUp shows 72 at
 * once and every tick is lit. Without JavaScript the dial is drawn full (globals.css).
 */
export function ChillDial({ hours, unit, unitLang }: ChillDialProps) {
  const lit = useRef<SVGGElement>(null);
  const shown = useRef(0);

  const onUpdate = (value: number) => {
    const g = lit.current;
    const n = Math.min(hours, Math.round(value));
    if (!g || n <= shown.current) return;
    for (let i = shown.current; i < n; i++) (g.children[i] as SVGElement | undefined)?.style.setProperty("opacity", "1");
    shown.current = n;
  };

  const ticks = Array.from({ length: hours }, (_, i) => {
    const major = i % MAJOR_EVERY === 0;
    const a = polar(major ? OUTER - 30 : OUTER - 18, i, hours);
    const b = polar(OUTER, i, hours);
    return { key: i, major, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  });

  return (
    <div className="@container relative mx-auto aspect-square w-full max-w-[min(34rem,72svh)]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full" aria-hidden>
        {/* Unlit ticks: --line-strong, about 3:1 on white, clearly lighter than the crimson lit ticks. */}
        <g className="stroke-line-strong" strokeLinecap="round">
          {ticks.map((t) => (
            <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.major ? 3 : 2} />
          ))}
        </g>
        <g ref={lit} className="dial-lit stroke-brand-crimson" strokeLinecap="round">
          {ticks.map((t) => (
            <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.major ? 4 : 3} />
          ))}
        </g>
        <g className="fill-muted-foreground font-display text-[15px] font-semibold tabular-nums" textAnchor="middle" dominantBaseline="middle">
          {MARKS.map((h) => {
            const p = polar(OUTER - 50, h, hours);
            return (
              <text key={h} x={p.x} y={p.y}>
                {h}
              </text>
            );
          })}
        </g>
      </svg>
      <p className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <CountUp
          to={hours}
          duration={2.4}
          onUpdate={onUpdate}
          className="font-display text-[34cqi] leading-[0.85] font-black tracking-[-0.05em] text-accent-text"
        />
        <span className="label mt-[3cqi] text-muted-foreground" lang={unitLang}>
          {unit}
        </span>
      </p>
    </div>
  );
}
