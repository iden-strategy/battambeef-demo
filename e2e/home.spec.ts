import { expect, test, type Page } from "@playwright/test";

// Home page: the "HOLY COW." hero and the sections below it.

const PORTRAIT = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
];
const LANDSCAPE = [
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const headerTheme = (page: Page) => page.locator("header.site-header").getAttribute("data-theme");

/** Where the hero images and the cow's measured edges sit on screen. */
async function heroGeometry(page: Page) {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".hero img"));
    const stage = document.querySelector(".hero-stage")!.getBoundingClientRect();
    const wide = imgs[0].currentSrc.includes("hero-wide");
    const pieces = Array.from(document.querySelectorAll(".hero-title [data-piece]"));
    // Measured cow edges, percent of the photo (src/lib/data/home.ts).
    const [l, r] = wide ? [0.188, 0.797] : [0.081, 0.944];
    return {
      photo: imgs[0].currentSrc,
      cow: imgs[1].currentSrc,
      fetchPriority: imgs[0].getAttribute("fetchpriority"),
      viewport: document.querySelector<HTMLElement>(".hero")!.clientWidth,
      stageLeft: stage.left,
      stageWidth: stage.width,
      cowLeft: stage.left + stage.width * l,
      cowRight: stage.left + stage.width * r,
      // The cutout file must fill its box undistorted (a wrong or stale file would not).
      cowAspectError: (() => {
        const c = imgs[1];
        const box = c.getBoundingClientRect();
        return Math.abs(c.naturalWidth / c.naturalHeight - box.width / box.height) / (box.width / box.height);
      })(),
      titleLeft: pieces[0].getBoundingClientRect().left,
      titleRight: pieces[pieces.length - 1].getBoundingClientRect().right,
    };
  });
}

test.describe("home hero", () => {
  for (const size of PORTRAIT) {
    test(`${size.width}×${size.height}: tall images, full width, cow never cropped`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/en", { waitUntil: "networkidle" });
      const g = await heroGeometry(page);
      expect(g.photo).toContain("hero-tall.webp");
      expect(g.cow).toContain("hero-tall-cutout.webp");
      expect(Math.round(g.stageLeft)).toBe(0);
      expect(Math.round(g.stageWidth)).toBe(g.viewport);
      expect(g.cowLeft).toBeGreaterThanOrEqual(0);
      expect(g.cowRight).toBeLessThanOrEqual(g.viewport);
      expect(g.cowAspectError).toBeLessThan(0.01);
      expect(g.titleLeft).toBeGreaterThanOrEqual(0);
      expect(g.titleRight).toBeLessThanOrEqual(g.viewport);
    });
  }

  for (const size of LANDSCAPE) {
    test(`${size.width}×${size.height}: wide images cover the screen, cow fully in view`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/en", { waitUntil: "networkidle" });
      const g = await heroGeometry(page);
      expect(g.photo).toContain("hero-wide.webp");
      expect(g.cow).toContain("hero-wide-cutout.webp");
      expect(g.stageLeft).toBeLessThanOrEqual(0);
      expect(g.stageLeft + g.stageWidth).toBeGreaterThanOrEqual(g.viewport);
      expect(g.cowLeft).toBeGreaterThanOrEqual(0);
      expect(g.cowRight).toBeLessThanOrEqual(g.viewport);
      expect(g.cowAspectError).toBeLessThan(0.01);
      expect(g.titleLeft).toBeGreaterThanOrEqual(0);
      expect(g.titleRight).toBeLessThanOrEqual(g.viewport);
    });
  }

  // The LCP element check is timing-sensitive: it lives in perf.spec.ts (runs alone).
  test("the hero photo is fetched at high priority, the cow is not", async ({ page }) => {
    await page.goto("/en");
    const imgs = page.locator(".hero img");
    await expect(imgs.nth(0)).toHaveAttribute("fetchpriority", "high");
    await expect(imgs.nth(0)).toHaveAttribute("loading", "eager");
    await expect(imgs.nth(1)).not.toHaveAttribute("fetchpriority", "high");
  });

  test("title: real text with a crimson full stop, behind the cow", async ({ page }) => {
    await page.goto("/en");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/Holy Cow\./);
    const info = await page.evaluate(() => {
      const accent = document.querySelector(".hero-title .split-accent")!;
      const z = (sel: string) => Array.from(document.querySelectorAll(".hero-stage > *")).findIndex((el) => el.matches(sel) || !!el.querySelector(sel));
      return {
        accent: accent.textContent,
        color: getComputedStyle(accent).color,
        titleLayer: z(".hero-title"),
        cowLayer: z('img[src*="cutout"], img[srcset*="cutout"]'),
      };
    });
    expect(info.accent).toBe(".");
    expect(info.color).toBe("rgb(123, 30, 43)");
    expect(info.cowLayer).toBeGreaterThan(info.titleLayer);
  });

  test("title is visible without JavaScript", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/en");
    await page.waitForTimeout(2500);
    const opacities = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>(".hero-title [data-piece]")).map((p) => getComputedStyle(p).opacity),
    );
    expect(opacities.length).toBeGreaterThan(0);
    expect(opacities.every((o) => o === "1")).toBe(true);
    await ctx.close();
  });

  test("desktop: pointer depth moves the scene and the title", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en", { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.classList.contains("motion-ready"));
    await page.mouse.move(720, 450);
    await page.mouse.move(1300, 200, { steps: 8 });
    await page.waitForTimeout(800);
    const t = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-depth]")).map((el) => el.style.transform),
    );
    expect(t.every((v) => v && v !== "none")).toBe(true);
  });

  test("reduced motion: no pointer depth, no blur, no drift", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/en", { waitUntil: "networkidle" });
    await page.mouse.move(720, 450);
    await page.mouse.move(1300, 200, { steps: 8 });
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(800);
    const s = await page.evaluate(() => ({
      depth: Array.from(document.querySelectorAll<HTMLElement>("[data-depth]")).map((el) => getComputedStyle(el).transform),
      filter: Array.from(document.querySelectorAll<HTMLElement>('[data-depth="scene"]')).map((el) => getComputedStyle(el).filter),
      stage: getComputedStyle(document.querySelector(".hero-stage")!).transform,
      melt: Number(getComputedStyle(document.querySelector(".hero-melt")!).opacity),
    }));
    expect(s.depth.every((v) => v === "none")).toBe(true);
    expect(s.filter.every((v) => v === "none")).toBe(true);
    expect(s.stage).toBe("none");
    expect(s.melt).toBeGreaterThan(0); // the melt still fades in (opacity only)
    await ctx.close();
  });

  test("scrolling melts the hero into charcoal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en", { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.classList.contains("motion-ready"));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.6, behavior: "instant" }));
    await page.waitForTimeout(400);
    const opacity = await page.evaluate(() => Number(getComputedStyle(document.querySelector(".hero-melt")!).opacity));
    expect(opacity).toBeGreaterThan(0.95);
  });
});

test.describe("home header", () => {
  test("photo over the hero, dark over dark sections, light over light and kraft", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en", { waitUntil: "networkidle" });
    await expect.poll(() => headerTheme(page)).toBe("photo");
    const header = page.locator("header.site-header");
    await expect(header).toHaveCSS("color", "rgb(41, 43, 45)");
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

    const scrollTo = async (sel: string) => {
      await page.evaluate((s) => {
        const el = document.querySelector(s)!;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 30, behavior: "instant" });
      }, sel);
      await page.mouse.wheel(0, -1); // keep the header on screen
      await page.waitForTimeout(350);
    };
    await scrollTo("#statement-heading");
    await expect.poll(() => headerTheme(page)).toBe("dark");
    await scrollTo("#business-heading");
    await expect.poll(() => headerTheme(page)).toBe("light");
    await scrollTo("#farm-heading");
    await expect.poll(() => headerTheme(page)).toBe("dark");
    await scrollTo("#knowledge-heading");
    await expect.poll(() => headerTheme(page)).toBe("light");
  });
});

test.describe("home sections", () => {
  test("cut map, featured cuts and teasers are on the page", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("#cut-map img").first()).toBeAttached();
    await expect(page.getByRole("region", { name: "Featured cuts" })).toBeAttached();
    await expect(page.getByRole("link", { name: "See Ribeye (Cube roll) on the cut map" })).toHaveAttribute("href", "/en/beef-cuts#rib");
    await expect(page.locator('[data-surface="light"]').filter({ has: page.locator("#business-heading") })).toBeAttached();
    await expect(page.locator('[data-surface="kraft"]').filter({ has: page.locator("#knowledge-heading") })).toBeAttached();
  });

  test("Khmer page renders the hero with the English fallback title", async ({ page }) => {
    await page.goto("/km");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/Holy Cow\./);
    await expect(h1).toHaveAttribute("lang", "en");
  });
});
