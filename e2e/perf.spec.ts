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

test.describe("beef cuts: LCP element", () => {
  // Measured with Lighthouse (lcp-breakdown-insight): the cut-map photo is the LCP on phones and
  // desktop, so it alone is preloaded at high priority (CutMap preload). 412×823 is Lighthouse's
  // mobile screen; the compact Business sub-navigation keeps the photo fully above the fold there.
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 412, height: 823 },
    { width: 1440, height: 900 },
  ]) {
    const phone = width < 768;
    test(`${width}px: the LCP element is the cut-map photo${phone ? ", fully on screen" : ""}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        const w = window as unknown as { __lcp: string };
        new PerformanceObserver((list) => {
          const last = list.getEntries().at(-1) as PerformanceEntry & { element?: Element };
          const el = last.element as HTMLImageElement | undefined;
          w.__lcp = el ? `${el.tagName} ${el.currentSrc ?? ""}` : "none";
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      await page.goto("/en/business/cuts", { waitUntil: "networkidle" });
      const photo = page.locator('#cut-map img[fetchpriority="high"]');
      await expect(photo).toHaveCount(1);
      // Real signals instead of a fixed sleep: the photo has loaded and an LCP entry exists.
      await photo.evaluate((el) => (el as HTMLImageElement).decode());
      await page.waitForFunction(() => Boolean((window as unknown as { __lcp?: string }).__lcp));
      const lcp = await page.evaluate(() => (window as unknown as { __lcp: string }).__lcp);
      const src = await photo.evaluate((el) => (el as HTMLImageElement).currentSrc);
      expect(lcp).toBe(`IMG ${src}`);
      // Phones: the whole photo above the fold (strict rule). Desktop: a regression guard, not a
      // design target: 38% of the photo's height is in the first screen at 1440x900 today, so the
      // bar is 30%.
      const box = (await photo.boundingBox())!;
      if (phone) expect(box.y + box.height).toBeLessThanOrEqual(height);
      else {
        const inFirstScreen = Math.min(box.y + box.height, height) - Math.max(box.y, 0);
        expect(inFirstScreen / box.height).toBeGreaterThanOrEqual(0.3);
      }
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
      await page.goto("/en/about#farm-to-table", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.evaluate(() => ((window as unknown as { __long: number[] }).__long = []));

      // From the start of the Farm to Table section (the hash scrolled there) to the 72-hour dial.
      const start = await page.evaluate(() => scrollY);
      const end = await page.locator("#chill").evaluate((el) => el.getBoundingClientRect().top + scrollY);
      for (let y = start; y < end; y += 120) {
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

test.describe("For Business dropdown: timing", () => {
  test("it closes about 150ms after the pointer leaves, not sooner", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/about");
    const nav = page.locator("header.site-header").getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("button", { name: "For Business pages" })).toBeVisible();
    await nav.getByRole("link", { name: "For Business", exact: true }).hover();
    const panel = page.locator("#forBusiness-menu");
    await expect(panel).toBeVisible();
    await panel.getByRole("link", { name: "Beef Knowledge" }).hover();
    await expect(panel).toHaveCSS("opacity", "1");

    // Record when the pointer leaves the item and when the panel closes, inside the page.
    await page.evaluate(() => {
      const item = document.getElementById("forBusiness-menu")!.parentElement!;
      const w = window as unknown as { __leave: number; __closed: number };
      w.__leave = 0;
      w.__closed = 0;
      item.addEventListener("pointerleave", () => (w.__leave ||= performance.now()));
      new MutationObserver(() => {
        if (item.dataset.state === "closed") w.__closed ||= performance.now();
      }).observe(item, { attributes: true, attributeFilter: ["data-state"] });
    });
    await page.mouse.move(20, 600); // the page's side gutter
    await expect(panel).toBeHidden();
    const { leave, closed } = await page.evaluate(() => {
      const w = window as unknown as { __leave: number; __closed: number };
      return { leave: w.__leave, closed: w.__closed };
    });
    expect(leave).toBeGreaterThan(0);
    expect(closed - leave).toBeGreaterThanOrEqual(140);
  });
});
