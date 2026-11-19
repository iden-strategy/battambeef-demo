import { expect, test } from "@playwright/test";
import { nextFrames, waitForMotionReady } from "./helpers";

// No hydration mismatches: the HTML rendered on the server must match what React renders in the
// browser. Runs against `next dev` (playwright.config.ts, project "styleguide"): only development
// React reports mismatches (production silently keeps the server's attributes), so this check
// cannot run on the production build.
//
// Typical cause: numbers computed with Math.sin/cos, which can differ in the last decimals between
// Node and the browser (the 72-hour dial rounds its coordinates for this reason).

const HYDRATION = /hydrat|didn't match|did not match|server rendered/i;

for (const path of ["/en/about", "/en/business/cuts"]) {
  test(`${path}: no hydration errors in the console`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const messages: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") messages.push(m.text());
    });
    page.on("pageerror", (e) => messages.push(e.message));
    let loads = 0;
    page.on("load", () => loads++);

    await page.goto(path);
    await waitForMotionReady(page);

    // Scroll through the page so everything that mounts on the way (the dial, the cut map) has run.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= height; y += 600) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await nextFrames(page);
    }
    await nextFrames(page, 10);

    // A reload by the dev server would start hydration over and could hide (or repeat) messages.
    expect(loads, "the dev server reloaded the page during the test").toBe(1);
    expect(messages.filter((m) => HYDRATION.test(m))).toEqual([]);
  });
}
