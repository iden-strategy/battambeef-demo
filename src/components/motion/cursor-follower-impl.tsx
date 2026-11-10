"use client";

import { AnimatePresence, useMotionValue, useSpring } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { SPRING_UI } from "@/components/motion/tokens";
import { useFallbackLang } from "@/i18n/use-fallback-lang";

import type { PointerSnapshot } from "@/components/motion/cursor-follower";
import type { CursorLabel } from "@/components/motion/cursor-target";

const DISC = 84; // labelled disc, px
const RING = 30; // idle ring, px

/**
 * A small ring that trails the native cursor (which is never hidden) and grows into a labelled
 * disc over elements marked with data-cursor="drag" | "explore" | "view".
 * Loaded by CursorFollower (cursor-follower.tsx) only with a fine pointer and motion allowed.
 * `getLatest` gives the pointer as last seen by CursorFollower (which listens from start-up):
 * when this starts listening, it picks up from there, so a pointer that moved while this code
 * was downloading is followed (and labelled) straight away, as before the code was split out.
 */
export function Follower({ getLatest }: { getLatest: () => PointerSnapshot | null }) {
  const t = useTranslations("kit");
  const lang = useFallbackLang();
  const [label, setLabel] = useState<CursorLabel | null>(null);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  useEffect(() => {
    const follow = (p: PointerSnapshot) => {
      x.set(p.x);
      y.set(p.y);
      setVisible(true);
      setLabel(p.label);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = e.target instanceof Element ? e.target.closest("[data-cursor]") : null;
      follow({ x: e.clientX, y: e.clientY, label: (target?.getAttribute("data-cursor") as CursorLabel | null) ?? null });
    };
    const onLeave = () => setVisible(false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    // Catch up with any move made before this listener existed (next frame, not during the effect).
    const catchUp = requestAnimationFrame(() => {
      const latest = getLatest();
      if (latest) follow(latest);
    });
    return () => {
      cancelAnimationFrame(catchUp);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y, getLatest]);

  const text =
    label === "drag" ? t("cursorDrag") : label === "explore" ? t("cursorExplore") : label === "view" ? t("cursorView") : "";

  return (
    <m.div aria-hidden className="pointer-events-none fixed top-0 left-0 z-[100]" style={{ x: sx, y: sy }}>
      <m.span
        // White ring for the charcoal base, with a thin charcoal halo so it stays visible over
        // light and kraft sections and over photos.
        className="absolute rounded-full border-[1.5px] border-brand-white shadow-[0_0_0_1px_rgba(41,43,45,0.6),inset_0_0_0_1px_rgba(41,43,45,0.6)]"
        style={{ width: RING, height: RING, left: -RING / 2, top: -RING / 2 }}
        animate={{ scale: label ? 2.4 : 1, opacity: visible && !label ? 1 : 0 }}
        transition={SPRING_UI}
      />
      <m.span
        // Crimson fill with a faint white edge so the disc reads against charcoal too.
        className="absolute flex items-center justify-center rounded-full bg-brand-crimson shadow-[0_0_0_1px_rgba(245,243,239,0.25)]"
        style={{ width: DISC, height: DISC, left: -DISC / 2, top: -DISC / 2 }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: label && visible ? 1 : 0.3, opacity: label && visible ? 1 : 0 }}
        transition={SPRING_UI}
      >
        <AnimatePresence>
          {label && (
            <m.span
              key={label}
              className="label text-brand-white"
              lang={lang(`kit.cursor${label[0].toUpperCase()}${label.slice(1)}`)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {text}
            </m.span>
          )}
        </AnimatePresence>
      </m.span>
    </m.div>
  );
}
