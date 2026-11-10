import { expect, test } from "@playwright/test";

// Timing-sensitive checks. They measure main-thread long tasks under 4× CPU throttling, so other
// browsers running at the same time would make them fail for reasons that have nothing to do with
// the site. playwright.config.ts runs this file in its own project, after every other test has
// finished, and serial mode below runs its tests one at a time: the machine is never shared.

test.describe.configure({ mode: "serial" });

test.describe("home: LCP element", () => {
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`${width}px: the LCP element is the hero photo`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        const w = window as unknown as { __lcp: string };
        new PerformanceObserver((list) => {
          const last = list.getEntries().at(-1) as PerformanceEntry & { element?: Element };
          const el = last.element as HTMLImageElement | undefined;
          w.__lcp = el ? `${el.tagName} ${el.currentSrc ?? ""}` : "none";
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      await page.goto("/en", { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const lcp = await page.evaluate(() => (window as unknown as { __lcp: string }).__lcp);
      expect(lcp).toMatch(/^IMG .*hero-(tall|wide)\.webp/);
    });
  }
});

test.describe("home: performance", () => {
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`${width}px: no long tasks while scrolling through the hero melt, 4× CPU throttle`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        const w = window as unknown as { __long: number[] };
        w.__long = [];
        new PerformanceObserver((list) => list.getEntries().forEach((e) => w.__long.push(Math.round(e.duration)))).observe({ type: "longtask" });
      });
      await page.goto("/en", { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      // Wake the pointer depth on desktop, then throttle.
      await page.mouse.move(width / 2, height / 2);
      await page.mouse.move(width * 0.8, height * 0.3, { steps: 5 });
      await page.waitForTimeout(500);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.evaluate(() => ((window as unknown as { __long: number[] }).__long = []));

      // Through the hero and into the statement, then back up.
      for (let y = 0; y < height * 1.3; y += 60) {
        await page.mouse.wheel(0, 60);
        await page.waitForTimeout(16);
      }
      for (let k = 0; k < 10; k++) {
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(16);
      }
      await page.waitForTimeout(600);
      const long = await page.evaluate(() => (window as unknown as { __long: number[] }).__long);
      console.log(`home ${width}px long tasks while scrolling:`, long.length ? long.join(", ") + " ms" : "none");
      expect(long).toEqual([]);
    });
  }
});

test.describe("farm to table: performance", () => {
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`${width}px: no long tasks while scrolling, 4× CPU throttle`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        const w = window as unknown as { __long: number[] };
        w.__long = [];
        new PerformanceObserver((list) => list.getEntries().forEach((e) => w.__long.push(Math.round(e.duration)))).observe({ type: "longtask" });
      });
      await page.goto("/en/farm-to-table", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.evaluate(() => ((window as unknown as { __long: number[] }).__long = []));

      const end = await page.locator("#chill").evaluate((el) => el.getBoundingClientRect().top + scrollY);
      for (let y = 0; y < end; y += 120) {
        await page.mouse.wheel(0, 120);
        await page.waitForTimeout(16);
      }
      for (let k = 0; k < 15; k++) {
        await page.mouse.wheel(0, -400);
        await page.waitForTimeout(16);
      }
      await page.waitForTimeout(600);
      const long = await page.evaluate(() => (window as unknown as { __long: number[] }).__long);
      console.log(`${width}px long tasks while scrolling:`, long.length ? long.join(", ") + " ms" : "none");
      expect(long).toEqual([]);
    });
  }
});
