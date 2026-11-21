import { expect, test, type Page } from "@playwright/test";
import { getFeaturedCuts } from "@/lib/data";
import { effectiveLang, waitForMotionReady } from "./helpers";

// Home page: the "HOLY COW." hero and the sections below it. The steak slider's behaviour has
// its own file (hero-slider.spec.ts).

const SIZES = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const headerTheme = (page: Page) => page.locator("header.site-header").getAttribute("data-theme");

type Box = { left: number; top: number; right: number; bottom: number };

/** Where the hero's parts sit on screen (the active slide's steak and caption). */
async function heroGeometry(page: Page) {
  return page.evaluate(() => {
    const box = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };
    const pieces = Array.from(document.querySelectorAll(".hero-title [data-piece]"));
    const steakImg = document.querySelector<HTMLImageElement>('.hero-slide[data-active="true"] img')!;
    const steakBox = steakImg.getBoundingClientRect();
    return {
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      title: box(".hero-title")!,
      titleLeft: pieces[0].getBoundingClientRect().left,
      titleRight: pieces[pieces.length - 1].getBoundingClientRect().right,
      steak: box('.hero-slide[data-active="true"] .hero-steak')!,
      // The image file must fill its box undistorted (a wrong-sized replacement would not).
      steakAspectError:
        Math.abs(steakImg.naturalWidth / steakImg.naturalHeight - steakBox.width / steakBox.height) / (steakBox.width / steakBox.height),
      caption: box('.hero-slide[data-active="true"] .hero-steak-caption')!,
      controls: box(".hero-slider-controls")!,
      pill: box(".hero-actions")!,
      note: box(".hero-note")!,
      bottomBar: box("#bottom-bar"),
    };
  });
}

const intersects = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test.describe("home hero", () => {
  for (const locale of ["en", "km"]) {
    for (const size of SIZES) {
      if (locale === "km" && ![360, 390, 1440].includes(size.width)) continue;
      test(`${locale} ${size.width}×${size.height}: everything in view, nothing overlaps, no sideways scroll`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto(`/${locale}`, { waitUntil: "networkidle" });
        await waitForMotionReady(page);
        // The pill rises in last (1.1s delay + 0.9s): measure where everything settles.
        await expect(page.locator(".hero-actions")).toHaveCSS("opacity", "1");
        const g = await heroGeometry(page);
        expect(g.scrollWidth).toBeLessThanOrEqual(g.viewport);
        expect(g.titleLeft).toBeGreaterThanOrEqual(0);
        expect(g.titleRight).toBeLessThanOrEqual(g.viewport);
        for (const [name, b] of Object.entries({ steak: g.steak, caption: g.caption, controls: g.controls, pill: g.pill, note: g.note })) {
          expect(b.left, name).toBeGreaterThanOrEqual(0);
          expect(b.right, name).toBeLessThanOrEqual(g.viewport);
        }
        expect(g.steakAspectError).toBeLessThan(0.01);
        // The steak overlaps the title on purpose (depth); everything else stacks without overlap.
        expect(intersects(g.steak, g.title)).toBe(true);
        const parts = [g.caption, g.controls, g.pill, g.note];
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) expect(intersects(parts[i], parts[j]), `parts ${i} and ${j}`).toBe(false);
        }
        expect(g.caption.top).toBeGreaterThanOrEqual(g.steak.bottom - 1);
        // Phones: the action pill is fully above the sticky bottom bar on first view.
        if (size.width < 768) {
          expect(g.bottomBar).not.toBeNull();
          expect(g.pill.bottom).toBeLessThanOrEqual(g.bottomBar!.top);
        } else {
          expect(g.pill.bottom).toBeLessThanOrEqual(size.height);
        }
      });
    }
  }

  // The LCP element check is timing-sensitive: it lives in perf.spec.ts (runs alone).
  test("the first steak is fetched eagerly at high priority", async ({ page }) => {
    await page.goto("/en");
    const first = page.locator('.hero-slide[data-slide="ribeye"] img');
    await expect(first).toHaveAttribute("fetchpriority", "high");
    await expect(first).toHaveAttribute("loading", "eager");
  });

  test("title: real white text with a signature red full stop, behind the steak", async ({ page }) => {
    await page.goto("/en");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/Holy Cow\./);
    const info = await page.evaluate(() => {
      const accent = document.querySelector(".hero-title .split-accent")!;
      const titleBlock = document.querySelector(".hero-title-block")!;
      const slider = document.querySelector(".hero-slider")!;
      return {
        accent: accent.textContent,
        color: getComputedStyle(accent).color,
        titleColor: getComputedStyle(document.querySelector(".hero-title")!).color,
        // Same parent, no z-index on either: the slider paints above the title because it comes
        // after it.
        sameParent: titleBlock.parentElement === slider.parentElement,
        sliderAfterTitle: !!(titleBlock.compareDocumentPosition(slider) & Node.DOCUMENT_POSITION_FOLLOWING),
        zIndexes: [getComputedStyle(titleBlock).zIndex, getComputedStyle(slider).zIndex],
      };
    });
    expect(info.accent).toBe(".");
    // --brand-red-on-dark (#E85A50): at least 3:1 against the charcoal and glow behind it.
    expect(info.color).toBe("rgb(232, 90, 80)");
    expect(info.titleColor).toBe("rgb(245, 243, 239)");
    expect(info.sameParent).toBe(true);
    expect(info.sliderAfterTitle).toBe(true);
    expect(info.zIndexes).toEqual(["auto", "auto"]);
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
    await waitForMotionReady(page);
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
    await waitForMotionReady(page);
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo({ top: window.innerHeight * 0.6, behavior: "instant" }));
    await page.waitForTimeout(400);
    const opacity = await page.evaluate(() => Number(getComputedStyle(document.querySelector(".hero-melt")!).opacity));
    expect(opacity).toBeGreaterThan(0.95);
  });
});

test.describe("home header", () => {
  test("dark over the hero and dark sections, light over light and kraft", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en", { waitUntil: "networkidle" });
    await expect.poll(() => headerTheme(page)).toBe("dark");
    // Over the dark hero, before scrolling: transparent with white text.
    const header = page.locator("header.site-header");
    await expect(header).toHaveCSS("color", "rgb(245, 243, 239)");
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
    const featured = page.getByRole("region", { name: "Featured cuts" });
    await expect(featured).toBeAttached();
    // Scoped: the hero's "See this cut" link has the same accessible name.
    await expect(featured.getByRole("link", { name: "See Ribeye (cube roll) on the cut map" })).toHaveAttribute("href", "/en/business/cuts#rib");
    // Featured cards show the cut photo (decorative: the card's name labels it).
    const featuredImgs = page.getByRole("region", { name: "Featured cuts" }).locator("img");
    await expect(featuredImgs).toHaveCount(6);
    await expect(featuredImgs.first()).toHaveAttribute("alt", "");
    await expect(page.getByRole("link", { name: "See Ribs with meat (short rib) on the cut map" })).toHaveAttribute("href", "/en/business/cuts#rib");
    await expect(page.locator('[data-surface="light"]').filter({ has: page.locator("#business-heading") })).toBeAttached();
    await expect(page.locator('[data-surface="kraft"]').filter({ has: page.locator("#knowledge-heading") })).toBeAttached();
  });

  test("Khmer page renders the hero with the English fallback title", async ({ page }) => {
    await page.goto("/km");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/Holy Cow\./);
    await expect(h1).toHaveAttribute("lang", "en");
  });

  test("Khmer featured cut cards name each cut in Khmer; English names sit in lang=en", async ({ page }) => {
    await page.goto("/km");
    const featured = page.locator("section[aria-labelledby=featured-heading]");
    const cards = featured.locator("article");
    const cuts = getFeaturedCuts();
    await expect(cards).toHaveCount(cuts.length);
    for (const [i, cut] of cuts.entries()) {
      const link = cards.nth(i).getByRole("heading", { level: 3 }).getByRole("link");
      const label = await link.getAttribute("aria-label");
      if (cut.nameKm) {
        // The Khmer sentence names the cut in Khmer, never in English.
        expect(label, cut.id).toContain(cut.nameKm);
        expect(label, cut.id).not.toContain(cut.nameEn);
        expect(await effectiveLang(link), cut.id).toBe("km");
      } else {
        // No Khmer name: no Khmer sentence; the link is named by its visible English text.
        expect(label, cut.id).toBeNull();
      }
      // The visible English name is marked as English.
      await expect(link.locator("span[lang=en]"), cut.id).toHaveText(cut.nameEn);
    }
    // Anywhere else in the cards, English cut names must be inside a lang=en element.
    const strays = await cards.evaluateAll((els, names) => {
      const out: string[] = [];
      for (const el of els) {
        for (const node of el.querySelectorAll("*")) {
          const own = Array.from(node.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join("");
          if (names.some((n) => own.includes(n)) && node.closest("[lang]")?.getAttribute("lang") !== "en") out.push(own.trim());
        }
      }
      return out;
    }, cuts.map((c) => c.nameEn));
    expect(strays).toEqual([]);
  });
});
