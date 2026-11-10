import type { Transition } from "motion/react";

// Global motion tokens (CLAUDE.md section 8).
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export const SPRING_UI: Transition = { type: "spring", stiffness: 260, damping: 30 };

export const DURATION = {
  uiFast: 0.15,
  ui: 0.3,
  reveal: 0.8,
  revealSlow: 1.1,
  page: 0.5,
  reducedFade: 0.2,
} as const;

export const revealTransition = (duration: number = DURATION.reveal, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE_OUT_EXPO,
});

export const reducedTransition: Transition = { duration: DURATION.reducedFade, ease: "linear" };
