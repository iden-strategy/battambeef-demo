"use client";

import { useMotionValue } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useId, useState, type PointerEvent } from "react";
import { SPRING_UI } from "@/components/motion/tokens";
import { useMotionPrefs } from "@/components/motion/use-motion-prefs";
import type { CowPartGeometry, CowPartId } from "@/lib/data/cow-map";
import { cn } from "@/lib/utils";

/** Language of a piece of text: "en" when it fell back to English, "km" for real Khmer, else page default. */
export type TextLang = "en" | "km" | undefined;

type CutMapSvgProps = {
  parts: CowPartGeometry[];
  /** Translated part names by id, and the language of each. */
  names: Record<string, string>;
  langs: Record<string, TextLang>;
  selectedId: CowPartId;
  onSelect: (id: CowPartId) => void;
  image: { src: string; width: number; height: number };
  silhouette: string;
  /** Preload the photo (the map is a main feature of the page it is on). */
  preload?: boolean;
};

const BADGE_R = 27;
// Invisible tap circle around each badge. Phones grow the badge 1.7x (container query below) and
// the map is ~305px wide at 360px, so 62 units × 1.7 × (305 / 1420) ≈ 22.6px radius: a 45px target.
const HIT_R = 62;

// Rendered sizes of the map: full width of the page container on small screens; from about 1120px
// the panel sits beside it and the map takes roughly 56% of the viewport, up to 800px.
const SIZES = "(min-width: 1536px) 800px, (min-width: 1120px) 56vw, calc(100vw - 2.5rem)";

/**
 * The photo is a normal next/image (responsive AVIF/WebP, correct sizes). A transparent SVG with
 * the photo's own pixel viewBox lies on top of it for regions and badges, so both always line up.
 * Regions are mouse/touch only; the chip row is the keyboard and screen reader interface, so the
 * overlay is hidden from assistive tech.
 */
export function CutMapSvg({
  parts,
  names,
  langs,
  selectedId,
  onSelect,
  image,
  silhouette,
  preload = false,
}: CutMapSvgProps) {
  const clipId = `cutmap-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { reduced } = useMotionPrefs();
  const [hovered, setHovered] = useState<CowPartId | null>(null);
  const tipX = useMotionValue(0);
  const tipY = useMotionValue(0);

  // Selected region is painted last so its outline sits on top of its neighbours'.
  const ordered = [...parts.filter((p) => p.id !== selectedId), ...parts.filter((p) => p.id === selectedId)];

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    tipX.set(e.clientX - r.left + 14);
    tipY.set(e.clientY - r.top + 18);
  };

  const hoverProps = (id: CowPartId) => ({
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === "mouse") setHovered(id);
    },
    onPointerLeave: () => setHovered((h) => (h === id ? null : h)),
    onClick: () => onSelect(id),
  });

  return (
    <figure className="@container/map relative m-0" onPointerMove={onMove}>
      {/* The photo's backdrop matches the stage colour behind it; the outer edges still fade a few percent. */}
      <div className="cutmap-fade">
        <div className="relative w-full" style={{ aspectRatio: `${image.width} / ${image.height}` }}>
          <Image
            src={image.src}
            alt=""
            fill
            sizes={SIZES}
            // The page's LCP image (Beef Cuts): preloaded AND fetched at high priority from the start.
            // Next 16's `preload` alone adds the preload link at the browser's default (low) priority.
            preload={preload}
            fetchPriority={preload ? "high" : undefined}
            draggable={false}
            className="pointer-events-none object-cover select-none"
          />
          <svg
            viewBox={`0 0 ${image.width} ${image.height}`}
            className="absolute inset-0 block size-full touch-manipulation select-none [-webkit-tap-highlight-color:transparent]"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <clipPath id={clipId}>
                <polygon points={silhouette} />
              </clipPath>
            </defs>

            <g clipPath={`url(#${clipId})`}>
              {ordered.map((p) => (
                <g
                  key={p.id}
                  className="group/r cursor-pointer"
                  data-cursor="explore"
                  data-selected={p.id === selectedId}
                  data-hovered={hovered === p.id}
                  {...hoverProps(p.id)}
                >
                  <polygon
                    points={p.polygon}
                    className="fill-brand-crimson opacity-0 transition-opacity duration-200 group-data-[hovered=true]/r:opacity-35 group-data-[selected=true]/r:opacity-60 motion-reduce:transition-none"
                  />
                  <polygon
                    points={p.polygon}
                    fill="none"
                    strokeWidth={1.5}
                    strokeDasharray="6 5"
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                    className="stroke-brand-white opacity-50 transition-opacity duration-200 group-data-[selected=true]/r:opacity-90 motion-reduce:transition-none"
                  />
                </g>
              ))}
            </g>

            {parts.map((p) => {
              const selected = p.id === selectedId;
              return (
                <g
                  key={p.id}
                  transform={`translate(${p.badge.x} ${p.badge.y})`}
                  className="cursor-pointer"
                  data-cursor="explore"
                  {...hoverProps(p.id)}
                >
                  {/* Below 640px of map width the badges grow and the names go (container query). */}
                  <g className="origin-center [transform-box:fill-box] @max-[40rem]/map:scale-[1.7]">
                    <m.g
                      style={{ transformBox: "fill-box", transformOrigin: "center" }}
                      animate={{ scale: selected ? 1.15 : 1 }}
                      transition={reduced ? { duration: 0 } : SPRING_UI}
                    >
                      {/* Invisible, larger tap target: the visible badge is small on phones. */}
                      <circle r={HIT_R} fill="transparent" data-hit="" />
                      <circle
                        r={BADGE_R}
                        strokeWidth={3}
                        className={selected ? "fill-brand-white stroke-brand-crimson" : "fill-brand-crimson stroke-brand-white"}
                      />
                      <text
                        textAnchor="middle"
                        dy=".35em"
                        fontSize={30}
                        fontWeight={700}
                        className={cn("font-display tabular-nums", selected ? "fill-brand-crimson" : "fill-brand-white")}
                      >
                        {p.number}
                      </text>
                    </m.g>
                  </g>
                  <text
                    y={BADGE_R + 34}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    strokeWidth={8}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    pointerEvents="none"
                    lang={langs[p.id]}
                    className={cn(
                      "fill-brand-white stroke-brand-charcoal @max-[40rem]/map:hidden",
                      langs[p.id] === "km" ? "font-khmer" : "font-display",
                    )}
                  >
                    {names[p.id]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div aria-hidden className="cutmap-floor" />
      </div>

      {/* Desktop only: a small tooltip with the part name next to the mouse. */}
      <m.div
        aria-hidden
        lang={hovered ? langs[hovered] : undefined}
        className={cn(
          "pointer-events-none absolute top-0 left-0 z-10 rounded-md bg-brand-charcoal px-2.5 py-1 text-sm font-semibold whitespace-nowrap text-brand-white shadow-lg ring-1 ring-brand-steel/30",
          hovered && langs[hovered] === "km" && "font-khmer text-[0.9375rem] leading-[1.7]",
        )}
        style={{ x: tipX, y: tipY }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: reduced ? 0 : 0.15 }}
      >
        {hovered ? names[hovered] : ""}
      </m.div>
    </figure>
  );
}
