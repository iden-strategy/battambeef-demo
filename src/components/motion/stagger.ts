/**
 * Per-element delay for `animate` from "motion/mini": element i starts at startDelay + i × step
 * (seconds). Same result as Motion's `stagger(step, { startDelay })`, without importing it.
 */
export const staggerDelay = (step: number, startDelay = 0) => (i: number) => startDelay + i * step;
