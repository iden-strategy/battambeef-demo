// Scroll-linked effects (the hero melt). Downloaded only by pages that use useScrollEffect, after
// start-up. Motion's scroll() drives a browser-native animation (motion/mini) from a native
// scroll timeline where the browser has one, so the effect runs off the main thread; elsewhere
// Motion updates it from its own scroll tracking, once per frame. Effects react to native
// scrolling and never control it.

import { scroll } from "motion";
import { animate } from "motion/mini";

type Keyframes = Record<string, (string | number)[]>;

type ScrollOffset = NonNullable<NonNullable<Parameters<typeof scroll>[1]>["offset"]>;

export type LinkScrollOptions = {
  /** Where each keyframe sits along the range, 0…1 (same length as the keyframe arrays). */
  times?: number[];
  /**
   * The scroll range, as Motion intersections ("<target edge> <viewport edge>").
   * Default: the target scrolling out at the top, ["start start", "end start"].
   */
  offset?: ScrollOffset;
};

/**
 * Plays `keyframes` on `el` as `target` moves through the scroll range (by default from the
 * target's top edge at the top of the viewport to its bottom edge there).
 * Returns a cleanup that detaches the effect and removes its styles.
 */
export function linkScroll(target: Element, el: Element | Element[], keyframes: Keyframes, { times, offset }: LinkScrollOptions = {}) {
  const animation = animate(el, keyframes, { duration: 1, ease: "linear", times });
  const stop = scroll(animation, { target, offset: offset ?? ["start start", "end start"] });
  return () => {
    // Cancel first: stopping a running animation commits its styles, which throws for an element
    // that is not rendered (e.g. a line segment hidden at this breakpoint).
    animation.cancel();
    stop();
  };
}
