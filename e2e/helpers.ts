import type { Locator, Page } from "@playwright/test";

/**
 * The language an element is read in: its own lang or the nearest ancestor's (translated text
 * carries no lang of its own and inherits <html lang="km">; only English fallbacks say "en").
 */
export const effectiveLang = (locator: Locator) =>
  locator.evaluate((el) => el.closest('[lang]:not([lang=""])')?.getAttribute("lang") ?? null);

// Shared waits for the e2e specs: real signals from the page, never fixed sleeps.

/** Text safe to put inside `new RegExp(...)` (cut names contain parentheses, e.g. "Ribeye (cube roll)"). */
export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The page is hydrated and its motion is live: useInViewReveal marks <html> "motion-ready" once
 * React runs (it also cancels the CSS no-JS failsafe). Header hiding, pointer effects, carousels
 * and in-view reveals only react after this.
 */
export async function waitForMotionReady(page: Page) {
  await page.waitForFunction(() => document.documentElement.classList.contains("motion-ready"));
}

/**
 * Wait for `n` real animation frames: after an instant scroll, scroll-linked effects (parallax,
 * IntersectionObserver callbacks) have run by the time two frames have painted.
 */
export async function nextFrames(page: Page, n = 2) {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let left = count;
        const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
      }),
    n,
  );
}
