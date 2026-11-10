import { expect, test, type Page } from "@playwright/test";

// Farm to Table: the journey (desktop sticky stage vs stacked blocks), the 72-hour dial,
// navigation away and back, reduced motion and Khmer. Scroll performance: perf.spec.ts.

const URL_EN = "/en/farm-to-table";
const desktop = (page: Page) => page.locator('[data-journey="desktop"]');
const stacked = (page: Page) => page.locator('[data-journey="stacked"]');
const stage = (page: Page) => page.locator('[data-journey="desktop"] > div'); // the sticky element
const activeStep = (page: Page) => page.locator('[data-rail-step][aria-current="step"]').getAttribute("data-rail-step");
const SCRUB_SETTLE = 900; // scrub smoothing is 0.5s

async function scrollToY(page: Page, y: number, settle = SCRUB_SETTLE) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForTimeout(settle);
}

/** The desktop track's position on the page and the scroll range over which the stage is held. */
async function track(page: Page) {
  return desktop(page).evaluate((el: HTMLElement) => {
    const top = el.getBoundingClientRect().top + window.scrollY;
    return { top, range: el.offsetHeight - window.innerHeight, vh: window.innerHeight };
  });
}

/** Scroll to a point in the journey: t = 0 … 5 in stage units (stage i is held around t = i + 0.6). */
async function scrollToStage(page: Page, t: number) {
  const { top, range } = await track(page);
  await scrollToY(page, top + (t / 5) * range);
}

async function panelOpacities(page: Page) {
  return page.locator("[data-panel]").evaluateAll((els) => els.map((e) => Number(getComputedStyle(e).opacity)));
}

async function noSidewaysScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe("farm to table: right version per screen", () => {
  const cases = [
    { width: 360, height: 780, version: "stacked" },
    { width: 390, height: 844, version: "stacked" },
    { width: 768, height: 1024, version: "stacked" },
    { width: 1024, height: 768, version: "desktop" },
    { width: 1280, height: 800, version: "desktop" },
    { width: 1440, height: 900, version: "desktop" },
  ] as const;

  for (const { width, height, version } of cases) {
    test(`${width}px: ${version} version, no sideways scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(URL_EN);
      await expect(desktop(page)).toBeVisible({ visible: version === "desktop" });
      await expect(stacked(page)).toBeVisible({ visible: version === "stacked" });
      expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(0);
      // Scroll the whole page once; nothing may push the page wider on the way.
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < h; y += height) await scrollToY(page, y, 60);
      expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(0);
    });
  }
});

test.describe("farm to table: desktop journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL_EN);
  });

  test("the stage stays in view for the whole journey, with no jump at the start or end", async ({ page }) => {
    // Sticky silently breaks if any ancestor hides or scrolls its overflow.
    const offenders = await stage(page).evaluate((el) => {
      const out: string[] = [];
      for (let p = el.parentElement; p; p = p.parentElement) {
        const s = getComputedStyle(p);
        const ok = (v: string) => v === "visible" || v === "clip";
        if (!ok(s.overflowX) || !ok(s.overflowY)) out.push(`${p.tagName.toLowerCase()} ${s.overflowX}/${s.overflowY}`);
      }
      return out;
    });
    expect(offenders).toEqual([]);

    const { top, range, vh } = await track(page);
    expect(range).toBeGreaterThan(vh * 3.5); // about 4 screen heights

    // Before the hold: the stage moves with the page.
    await scrollToY(page, top - 300, 100);
    expect((await stage(page).boundingBox())!.y).toBeCloseTo(300, 0);

    // During: held at the top of the screen, every step of the way.
    for (const f of [0, 0.05, 0.2, 0.4, 0.6, 0.8, 0.95, 1]) {
      await scrollToY(page, top + f * range, 100);
      const box = (await stage(page).boundingBox())!;
      expect(Math.abs(box.y), `at ${f}`).toBeLessThanOrEqual(1);
      expect(box.height).toBeCloseTo(vh, 0);
    }

    // After: it scrolls away with the page, continuously (no jump).
    await scrollToY(page, top + range + 300, 100);
    expect((await stage(page).boundingBox())!.y).toBeCloseTo(-300, 0);
  });

  test("each stage becomes active in turn: rail, photo and text", async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await scrollToStage(page, i + 0.6);
      expect(await activeStep(page)).toBe(String(i));
      const opacities = await panelOpacities(page);
      expect(opacities[i], `panel ${i}`).toBeCloseTo(1, 1);
      opacities.forEach((o, j) => j !== i && expect(o, `panel ${j} hidden at stage ${i}`).toBeLessThan(0.05));
      // Screen readers get only the stage on screen (text and photo layer).
      for (const sel of ["[data-panel]", "[data-layer]"]) {
        const hidden = await page.locator(sel).evaluateAll((els) => els.map((e) => e.getAttribute("aria-hidden")));
        expect(hidden, `${sel} at stage ${i}`).toEqual(hidden.map((_, j) => (j === i ? null : "true")));
      }
      // Photo layers up to i are open, later ones closed.
      const clips = await page.locator("[data-layer]").evaluateAll((els) => els.map((e) => getComputedStyle(e).clipPath));
      clips.forEach((c, j) => {
        if (j === 0) return;
        if (j <= i) expect(c, `layer ${j}`).toMatch(/inset\(0(px|%)?\)|^none$/);
        else expect(c, `layer ${j}`).toMatch(/inset\(100%/);
      });
    }
  });

  test("fast scrolling down and back up both end in the right state", async ({ page }) => {
    const { top, range } = await track(page);
    await scrollToY(page, top - 200, 100);
    for (let k = 0; k < 20; k++) await page.mouse.wheel(0, 500);
    await page.waitForFunction((end) => window.scrollY > end, top + range);
    await page.waitForTimeout(SCRUB_SETTLE);
    expect(await activeStep(page)).toBe("4");
    expect((await panelOpacities(page))[4]).toBeCloseTo(1, 1);

    for (let k = 0; k < 25; k++) await page.mouse.wheel(0, -500);
    await page.waitForFunction((start) => window.scrollY < start, top);
    await page.waitForTimeout(SCRUB_SETTLE);
    expect(await activeStep(page)).toBe("0");
    const opacities = await panelOpacities(page);
    expect(opacities[0]).toBeCloseTo(1, 1);
    expect(Math.max(...opacities.slice(1))).toBeLessThan(0.05);
  });

  test("rail buttons jump to a stage (keyboard)", async ({ page }) => {
    await scrollToStage(page, 0.2);
    const third = page.locator('[data-rail-step="2"]');
    await expect(third).toHaveAccessibleName("Go to stage 3: Chilled for 72 hours");
    await third.focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => activeStep(page), { timeout: 5000 }).toBe("2");
  });
});

test.describe("farm to table: phones", () => {
  test("stacked blocks with a sticky progress bar that follows the stage", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(URL_EN);
    const bar = page.locator(".journey-bar");
    const blocks = page.locator("[data-block]");
    await expect(blocks).toHaveCount(5);

    for (const i of [0, 2, 4]) {
      // Put the middle of block i at the middle of the screen.
      const y = await blocks.nth(i).evaluate((el: HTMLElement) => el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2);
      await scrollToY(page, y, 500);
      await expect(bar).toBeInViewport();
      const barTop = (await bar.boundingBox())!.y;
      expect(barTop).toBeGreaterThanOrEqual(-1);
      expect(barTop).toBeLessThanOrEqual(64 + 1); // under the header, or at the top when it hides
      await expect(page.locator("[data-bar-label][data-current]")).toHaveText(`Stage ${i + 1} of 5 · ${["Raising", "Processing", "Chilling", "Cutting", "Delivery"][i]}`);
    }
  });
});

test.describe("farm to table: navigation", () => {
  test("the trigger-count test hook is absent for normal visitors", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL_EN);
    await expect(page.locator("[data-rail-step]").first()).toBeAttached();
    await page.waitForTimeout(500);
    await expect(page.locator("[data-scroll-triggers]")).toHaveCount(0);
  });

  test("leaving and coming back keeps exactly one set of triggers, and the journey still works", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => ((window as { __BB_E2E__?: boolean }).__BB_E2E__ = true));
    await page.goto(URL_EN);
    const root = page.locator("[data-scroll-triggers]");
    const first = await root.getAttribute("data-scroll-triggers");
    expect(Number(first)).toBeGreaterThan(0);

    const nav = page.getByRole("navigation", { name: "Main" });
    for (let round = 0; round < 2; round++) {
      await nav.getByRole("link", { name: "Beef Cuts" }).click();
      await expect(page).toHaveURL(/\/en\/beef-cuts$/);
      await nav.getByRole("link", { name: "Farm to Table" }).click();
      await expect(page).toHaveURL(/\/en\/farm-to-table$/);
      await page.waitForTimeout(800); // page transition
      await expect(root.locator("visible=true")).toHaveCount(1);
      await expect(root).toHaveAttribute("data-scroll-triggers", first!);
    }

    await scrollToStage(page, 3.6);
    expect(await activeStep(page)).toBe("3");
    expect(Math.abs((await stage(page).boundingBox())!.y)).toBeLessThanOrEqual(1);
  });
});

test.describe("farm to table: reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  for (const width of [390, 1440]) {
    test(`${width}px: stacked blocks, no held stage, full dial`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(URL_EN);
      await expect(desktop(page)).toBeHidden();
      await expect(stacked(page)).toBeVisible();

      await page.locator("#chill").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await expect(page.locator("#chill .tabular > span[aria-hidden]")).toHaveText("72");
      const lit = await page.locator(".dial-lit > line").evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
      expect(lit).toHaveLength(72);
      expect(lit.every((o) => o === "1")).toBe(true);

      // The progress bar still follows the stage, whole segments at a time.
      const block = page.locator("[data-block]").nth(1);
      const y = await block.evaluate((el: HTMLElement) => el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2);
      await scrollToY(page, y, 300);
      const widths = await page.locator("[data-seg-fill]").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
      expect(widths[0]).toBeGreaterThan(0);
      expect(widths[1]).toBeGreaterThan(0);
      expect(widths.slice(2)).toEqual([0, 0, 0]);
    });
  }
});

test.describe("farm to table: dial and surfaces", () => {
  test("the dial counts to 72 and lights all 72 ticks; the header turns light over it", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL_EN);
    const chillTop = await page.locator("#chill").evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await scrollToY(page, chillTop + 200, 100);
    await scrollToY(page, chillTop + 100, 3000); // scrolling up brings the header back
    await expect(page.locator("#chill .tabular > span[aria-hidden]")).toHaveText("72");
    const lit = await page.locator(".dial-lit > line").evaluateAll((els) => els.filter((e) => getComputedStyle(e).opacity === "1").length);
    expect(lit).toBe(72);
    // Unlit ticks: about 3:1 on white (#84888c), lighter than the crimson lit ticks.
    const unlit = await page.locator(".dial-lit").evaluate((g) => getComputedStyle(g.previousElementSibling!).stroke);
    expect(unlit).toBe("rgb(132, 136, 140)");
    await expect(page.locator("header.site-header")).toHaveAttribute("data-theme", "light");

    await scrollToStage(page, 2.6);
    await page.mouse.wheel(0, -50);
    await expect(page.locator("header.site-header")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("farm to table: Khmer", () => {
  for (const width of [390, 1440]) {
    test(`${width}px: renders, untranslated text is marked English, nothing overflows`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/km/farm-to-table");
      await expect(page.locator("html")).toHaveAttribute("lang", "km");
      await expect(page.locator("h1")).toBeVisible();
      // Missing Khmer copy (TODO-KM) falls back to English and says so.
      await expect(page.locator("h3:visible").first()).toHaveAttribute("lang", "en");
      expect(await noSidewaysScroll(page)).toBeLessThanOrEqual(0);
      const clipped = await page.locator(":is(h1, h2, h3, [data-panel] p, [data-block] p):not(.sr-only)").evaluateAll((els) =>
        els.filter((e) => (e as HTMLElement).offsetParent && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent),
      );
      expect(clipped).toEqual([]);
    });
  }
});

test.describe("farm to table: desktop failsafe", () => {
  const TITLES = ["Raised in Battambang", "Slaughter and processing", "Chilled for 72 hours", "Cut and packed", "Delivery"];

  /** Product of the opacities of an element and all its ancestors: what the eye actually gets. */
  const seenOpacity = (el: Element) => {
    let o = 1;
    for (let e: Element | null = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    return o;
  };

  async function expectAllStagesReadable(page: Page) {
    await expect(desktop(page)).toBeHidden();
    await expect(stacked(page)).toBeVisible();
    const blocks = page.locator("[data-block]");
    await expect(blocks).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const block = blocks.nth(i);
      await block.scrollIntoViewIfNeeded();
      await expect(block.locator("h3")).toHaveText(TITLES[i]);
      for (const text of [block.locator("h3"), block.locator("p.body-lg")]) {
        await expect.poll(() => text.evaluate(seenOpacity), { message: `stage ${i + 1} text`, timeout: 3000 }).toBeGreaterThan(0.99);
      }
    }
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
  }

  test("GSAP chunk blocked: the stacked version takes over, all five stages readable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let blocked = 0;
    await page.route(/\/_next\/static\/chunks\/.+\.js(\?.*)?$/, async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (body.includes("ScrollTrigger")) {
        blocked++;
        return route.abort();
      }
      return route.fulfill({ response, body });
    });
    await page.goto(URL_EN);
    await expect(page.locator("html")).toHaveClass(/\bjourney-fallback\b/);
    expect(blocked).toBeGreaterThan(0);
    await expectAllStagesReadable(page);
  });

  test("the app never starts: the stacked version shows after the failsafe, all five stages readable", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route(/\/_next\/static\/chunks\/.+\.js(\?.*)?$/, (route) => route.abort());
    await page.goto(URL_EN);
    // Before the failsafe: the desktop version (as for every desktop visitor before the app starts).
    await expect(desktop(page)).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/\bapp-stalled\b/, { timeout: 8000 });
    await expect(page.locator(".journey-bar")).toBeHidden(); // it needs the script to mean anything
    await expectAllStagesReadable(page);
  });
});

test.describe("farm to table: GSAP only for the desktop journey", () => {
  for (const { width, height, expected } of [
    { width: 390, height: 844, expected: false },
    { width: 1440, height: 900, expected: true },
  ]) {
    test(`${width}px: GSAP ${expected ? "is" : "is never"} downloaded`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      const bodies: Promise<string>[] = [];
      page.on("response", (r) => {
        if (r.url().endsWith(".js")) bodies.push(r.text().catch(() => ""));
      });
      await page.goto(URL_EN, { waitUntil: "networkidle" });
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(500);
      const hasGsap = (await Promise.all(bodies)).some((b) => b.includes("ScrollTrigger"));
      expect(hasGsap).toBe(expected);
    });
  }
});
