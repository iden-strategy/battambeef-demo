import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { cutMapHref } from "@/lib/cut-links";
import { getHeroSlides } from "@/lib/data";
import { waitForMotionReady } from "./helpers";

// Home hero steak slider (components/home/hero-slider.tsx), WAI-ARIA carousel pattern.
// Timing uses Playwright's clock (page.clock), never real waiting.

type HeroMessages = {
  sliderLabel: string;
  showSlide: string;
  pause: string;
  play: string;
  seeCut: string;
  seeCutAria: string;
  steaks: Record<string, { name: string; alt: string }>;
};
const heroMessages = (locale: string): HeroMessages => JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")).home.hero;

const SLIDES = getHeroSlides();
const EXPECTED_ANCHORS = { ribeye: "#rib", striploin: "#loin", rump: "#rump" } as Record<string, string>;
const ROTATE_MS = 4000;

const active = (page: Page) => page.locator('.hero-slide[data-active="true"]').getAttribute("data-slide");
/** "off" while rotating, "polite" while paused: a direct view of the pause state. */
const live = (page: Page) => page.locator("[data-hero-slides]").getAttribute("aria-live");

/** Hydrated, and the other two images mounted and loaded (rotation only moves to a loaded image). */
async function ready(page: Page) {
  await waitForMotionReady(page);
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(".hero-slide img"));
    return imgs.length === 3 && imgs.every((img) => img.complete && img.naturalWidth > 0);
  });
}

/** Mouse to a corner of the page, away from the steak, the caption and the controls. */
async function mouseAway(page: Page) {
  await page.mouse.move(5, (page.viewportSize()?.height ?? 720) - 5);
}

/** Mouse away and focus out of the page's controls. */
async function leave(page: Page) {
  await mouseAway(page);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

/**
 * Start a fresh 4-second wait: hovering the caption pauses the slider and leaving re-arms its timer
 * from zero (the clock still flows in real time between steps, so the load-time timer is not exact).
 */
async function restartTimer(page: Page) {
  await page.locator('.hero-slide[data-active="true"] .hero-steak-name').hover();
  await expect.poll(() => live(page)).toBe("polite");
  await leave(page);
  await expect.poll(() => live(page)).toBe("off");
}

test.describe("hero slider: content", () => {
  for (const locale of ["en", "km"]) {
    test(`${locale}: 3 slides with the short names, cut-map links and labels that contain the visible text`, async ({ page }) => {
      const m = heroMessages(locale);
      await page.goto(`/${locale}`);
      const slides = page.locator(".hero-slide");
      await expect(slides).toHaveCount(3);
      expect(SLIDES.map((s) => s.cutId)).toEqual(["ribeye", "striploin", "rump"]);
      for (const [i, s] of SLIDES.entries()) {
        const slide = slides.nth(i);
        const name = m.steaks[s.cutId].name;
        await expect(slide).toHaveAttribute("data-slide", s.cutId);
        await expect(slide.locator(".hero-steak-name")).toHaveText(name);
        // No uppercase transform on the name (Khmer must never be uppercased).
        await expect(slide.locator(".hero-steak-name")).toHaveCSS("text-transform", "none");
        const link = slide.locator("a.hero-steak-link");
        expect(cutMapHref(s.cut)).toBe(`/business/cuts${EXPECTED_ANCHORS[s.cutId]}`);
        await expect(link).toHaveAttribute("href", `/${locale}/business/cuts${EXPECTED_ANCHORS[s.cutId]}`);
        // The link's name contains its visible text, then the visible short name ("See this cut:
        // Ribeye Steak"), so voice control users can say what they see.
        await expect(link).toHaveText(m.seeCut);
        const label = (await link.getAttribute("aria-label")) ?? "";
        expect(label).toBe(m.seeCutAria.replace("{cut}", name));
        expect(label.startsWith(m.seeCut)).toBe(true);
        expect(label).toContain(name);
        // Dots are named with the short names.
        await expect(page.getByRole("button", { name: m.showSlide.replace("{cut}", name), exact: true })).toHaveCount(1);
      }
      const region = page.getByRole("region", { name: m.sliderLabel, exact: true });
      await expect(region).toHaveAttribute("aria-roledescription", "carousel");
      await expect(region.locator(".hero-slide")).toHaveCount(3);
      await expect(slides.first()).toHaveAttribute("aria-roledescription", "slide");
    });
  }
});

test.describe("hero slider: loading", () => {
  test("only the first image is in the page; the others load after the page has loaded", async ({ page }) => {
    const html = await (await page.request.get("/en")).text();
    expect(html.match(/<img[^>]+steak-/g) ?? []).toHaveLength(1);
    expect(html).toMatch(/<img[^>]+steak-ribeye/);
    expect(html).not.toMatch(/<link[^>]+steak-(striploin|rump)/);

    await page.goto("/en");
    const first = page.locator('.hero-slide[data-slide="ribeye"] img');
    await expect(first).toHaveAttribute("loading", "eager");
    await expect(first).toHaveAttribute("fetchpriority", "high");
    await ready(page);
    const t = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const res = performance.getEntriesByType("resource").filter((r) => /steak-(striploin|rump)/.test(r.name));
      return { load: nav.loadEventStart, starts: res.map((r) => r.startTime) };
    });
    expect(t.starts).toHaveLength(2);
    for (const start of t.starts) expect(start).toBeGreaterThanOrEqual(t.load);
  });

  test("a slide whose image fails to load is skipped, and rotation goes on", async ({ page }) => {
    await page.route(/steak-striploin/, (route) => route.abort());
    await page.clock.install();
    await page.goto("/en");
    await waitForMotionReady(page);
    await expect(page.getByRole("button", { name: "Show Striploin Steak" })).toBeDisabled();
    await page.waitForFunction(() => {
      const img = document.querySelector<HTMLImageElement>('.hero-slide[data-slide="rump"] img');
      return !!img && img.complete && img.naturalWidth > 0;
    });
    await restartTimer(page);
    expect(await active(page)).toBe("ribeye");
    await page.clock.runFor(ROTATE_MS - 1000);
    expect(await active(page)).toBe("ribeye");
    await page.clock.runFor(1500);
    await expect.poll(() => active(page)).toBe("rump");
    await page.clock.runFor(ROTATE_MS + 100);
    await expect.poll(() => active(page)).toBe("ribeye");
  });

  test("picking a slide whose image is still loading keeps the current steak until it has loaded", async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route(/steak-striploin/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.goto("/en");
    await waitForMotionReady(page);
    await page.getByRole("button", { name: "Show Striploin Steak" }).click();
    await page.waitForTimeout(500);
    // No empty frame: the ribeye stays on screen, and its dot stays current.
    expect(await active(page)).toBe("ribeye");
    await expect(page.locator('.hero-slide[data-slide="ribeye"]')).toHaveCSS("opacity", "1");
    await expect(page.locator(".hero-slider-dot").nth(0)).toHaveAttribute("aria-current", "true");
    release();
    await expect.poll(() => active(page)).toBe("striploin");
    await expect(page.locator(".hero-slider-dot").nth(1)).toHaveAttribute("aria-current", "true");
  });
});

test.describe("hero slider: rotation", () => {
  test("advances every 4 seconds", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    await restartTimer(page);
    expect(await active(page)).toBe("ribeye");
    await page.clock.runFor(ROTATE_MS - 1000);
    expect(await active(page)).toBe("ribeye");
    await page.clock.runFor(1500);
    await expect.poll(() => active(page)).toBe("striploin");
    await page.clock.runFor(ROTATE_MS + 100);
    await expect.poll(() => active(page)).toBe("rump");
    await page.clock.runFor(ROTATE_MS + 100);
    await expect.poll(() => active(page)).toBe("ribeye");
  });

  test("pauses while the caption is hovered, resumes on leave", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    await page.locator('.hero-slide[data-active="true"] .hero-steak-name').hover();
    await expect.poll(() => live(page)).toBe("polite");
    await page.clock.runFor(ROTATE_MS * 2);
    expect(await active(page)).toBe("ribeye");
    await leave(page);
    await page.clock.runFor(ROTATE_MS + 100);
    await expect.poll(() => active(page)).toBe("striploin");
  });

  test("pauses while the steak box is hovered, resumes on leave", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    const frame = (await page.locator(".hero-steak-frame").boundingBox())!;
    await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2);
    // The position check runs in an animation frame.
    await page.clock.runFor(100);
    await expect.poll(() => live(page)).toBe("polite");
    await page.clock.runFor(ROTATE_MS * 2);
    expect(await active(page)).toBe("ribeye");
    await mouseAway(page);
    await page.clock.runFor(100);
    await expect.poll(() => live(page)).toBe("off");
    await page.clock.runFor(ROTATE_MS + 100);
    await expect.poll(() => active(page)).toBe("striploin");
  });

  test("hovering the title or the action buttons does not pause it", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    await restartTimer(page);
    // A point on the title that is outside the steak box.
    const title = (await page.locator(".hero-title").boundingBox())!;
    const frame = (await page.locator(".hero-steak-frame").boundingBox())!;
    const point = { x: title.x + title.width / 2, y: title.y + title.height * 0.15 };
    expect(point.y).toBeLessThan(frame.y);
    await page.mouse.move(point.x, point.y);
    await page.clock.runFor(100);
    expect(await live(page)).toBe("off");
    await page.clock.runFor(ROTATE_MS);
    await expect.poll(() => active(page)).toBe("striploin");

    await page.getByRole("link", { name: "Explore our cuts", exact: true }).hover();
    await page.clock.runFor(100);
    expect(await live(page)).toBe("off");
    await page.clock.runFor(ROTATE_MS);
    await expect.poll(() => active(page)).toBe("rump");
  });

  test("keyboard focus inside pauses it; blur resumes", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    await leave(page);
    await page.locator('.hero-slide[data-active="true"] a.hero-steak-link').focus();
    await page.keyboard.press("Tab");
    const toggle = page.locator(".hero-slider-toggle");
    await expect(toggle).toBeFocused();
    expect(await toggle.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
    await expect.poll(() => live(page)).toBe("polite");
    await page.clock.runFor(ROTATE_MS * 2);
    expect(await active(page)).toBe("ribeye");
    await leave(page);
    await page.clock.runFor(ROTATE_MS + 100);
    await expect.poll(() => active(page)).toBe("striploin");
  });

  test("a mouse click on a dot does not leave it paused", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    await page.getByRole("button", { name: "Show Striploin Steak" }).click();
    expect(await active(page)).toBe("striploin");
    // Focus stays on the dot, but a mouse click is not keyboard focus: moving away resumes.
    await mouseAway(page);
    await expect.poll(() => live(page)).toBe("off");
    await page.clock.runFor(ROTATE_MS + 100);
    await expect.poll(() => active(page)).toBe("rump");
  });

  test("the pause button stops it; play starts it again (mouse)", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    await page.getByRole("button", { name: "Pause slideshow" }).click();
    const play = page.getByRole("button", { name: "Play slideshow" });
    await expect(play).toBeVisible();
    await mouseAway(page);
    await page.clock.runFor(ROTATE_MS * 2);
    expect(await active(page)).toBe("ribeye");
    await play.click();
    await expect(page.getByRole("button", { name: "Pause slideshow" })).toBeVisible();
    // No blur: focus stays on the button.
    await mouseAway(page);
    await expect.poll(() => live(page)).toBe("off");
    await page.clock.runFor(ROTATE_MS + 100);
    await expect.poll(() => active(page)).toBe("striploin");
  });

  test("play from the keyboard starts it even with focus still on the button", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    await leave(page);
    await page.locator('.hero-slide[data-active="true"] a.hero-steak-link').focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Play slideshow" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Pause slideshow" })).toBeFocused();
    await expect.poll(() => live(page)).toBe("off");
    await page.clock.runFor(ROTATE_MS + 100);
    await expect.poll(() => active(page)).toBe("striploin");
  });

  const stuck: [string, (page: Page) => Promise<void>][] = [
    ["the window loses focus", (page) => page.evaluate(() => void window.dispatchEvent(new Event("blur")))],
    ["the mouse leaves the page", (page) => page.evaluate(() => void document.documentElement.dispatchEvent(new MouseEvent("mouseleave")))],
    [
      "the tab is hidden and shown again",
      (page) =>
        page.evaluate(() => {
          for (const hidden of [true, false]) {
            Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
            document.dispatchEvent(new Event("visibilitychange"));
          }
        }),
    ],
  ];
  for (const [when, act] of stuck) {
    test(`hover never gets stuck: cleared when ${when}`, async ({ page }) => {
      await page.clock.install();
      await page.goto("/en");
      await ready(page);
      await page.locator('.hero-slide[data-active="true"] .hero-steak-name').hover();
      await expect.poll(() => live(page)).toBe("polite");
      await act(page);
      await expect.poll(() => live(page)).toBe("off");
      await page.clock.runFor(ROTATE_MS + 100);
      await expect.poll(() => active(page)).toBe("striploin");
    });
  }

  test("hidden tab: no rotation", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    await leave(page);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.clock.runFor(ROTATE_MS * 2);
    expect(await active(page)).toBe("ribeye");
  });

  test("reduced motion: no rotation, no pause button, instant switching", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.clock.install();
    await page.goto("/en");
    await ready(page);
    await leave(page);
    await page.clock.runFor(20_000);
    expect(await active(page)).toBe("ribeye");
    await expect(page.locator(".hero-slider-toggle")).toBeHidden();
    await page.getByRole("button", { name: "Show Rump Steak" }).click();
    expect(await active(page)).toBe("rump");
    // No fade: the new slide is fully visible straight away, the old one gone.
    await expect(page.locator('.hero-slide[data-slide="rump"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('.hero-slide[data-slide="ribeye"]')).toHaveCSS("visibility", "hidden");
    await ctx.close();
  });
});

test.describe("hero slider: dots and announcements", () => {
  test("dots switch slides and mark the current one; only a picked slide is announced", async ({ page }) => {
    await page.goto("/en");
    await ready(page);
    await leave(page);
    const liveRegion = page.locator("[data-hero-slides]");
    // Rotating: nothing is announced.
    await expect(liveRegion).toHaveAttribute("aria-live", "off");
    const dots = page.locator(".hero-slider-dot");
    await expect(dots.nth(0)).toHaveAttribute("aria-current", "true");

    await page.getByRole("button", { name: "Show Striploin Steak" }).click();
    expect(await active(page)).toBe("striploin");
    await expect(dots.nth(1)).toHaveAttribute("aria-current", "true");
    await expect(dots.nth(0)).not.toHaveAttribute("aria-current", /.+/);
    await expect(dots.nth(2)).not.toHaveAttribute("aria-current", /.+/);
    // The user picked it (the mouse is over the controls, rotation paused): it is announced.
    await expect(liveRegion).toHaveAttribute("aria-live", "polite");
    // Only the current slide is exposed and reachable.
    await expect(page.locator('.hero-slide[data-slide="striploin"]')).toHaveAttribute("aria-hidden", "false");
    for (const id of ["ribeye", "rump"]) {
      const slide = page.locator(`.hero-slide[data-slide="${id}"]`);
      await expect(slide).toHaveAttribute("aria-hidden", "true");
      await expect(slide).toHaveAttribute("inert", "");
    }

    await page.getByRole("button", { name: "Show Rump Steak" }).click();
    expect(await active(page)).toBe("rump");
    await expect(dots.nth(2)).toHaveAttribute("aria-current", "true");
  });
});

test.describe("hero slider: the steak never catches clicks", () => {
  for (const size of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`${size.width}px: "See this cut" and both hero buttons always work`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto("/en");
      await waitForMotionReady(page);
      // Only the caption and the controls catch the pointer.
      const pe = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).pointerEvents);
      for (const sel of [".hero-slide", ".hero-steak", ".hero-steak-settle", ".hero-steak-img"]) expect(await pe(sel), sel).toBe("none");
      for (const sel of [".hero-steak-caption", ".hero-slider-controls"]) expect(await pe(sel), sel).toBe("auto");

      const targets = [
        { name: "See this cut: Ribeye Steak", url: /\/en\/business\/cuts#rib$/ },
        { name: "Explore our cuts", url: /\/en\/business\/cuts$/ },
        { name: "For restaurants", url: /\/en\/business$/ },
      ];
      for (const { name, url } of targets) {
        await page.goto("/en");
        await waitForMotionReady(page);
        const link = page.locator(".hero").getByRole("link", { name, exact: true });
        await expect(link).toBeVisible();
        // The topmost element under the link's centre is the link itself (or its text/icon).
        const hit = await link.evaluate((el) => {
          const r = el.getBoundingClientRect();
          const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !!top && (top === el || el.contains(top));
        });
        expect(hit, name).toBe(true);
        await link.click();
        await expect(page).toHaveURL(url);
      }
    });
  }
});

test.describe("hero slider: layout stability", () => {
  test("no layout shift on load or while switching", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number };
      w.__cls = 0;
      // Every shift counts, even right after input (the dot clicks below).
      new PerformanceObserver((list) => list.getEntries().forEach((e) => (w.__cls += (e as PerformanceEntry & { value: number }).value))).observe({
        type: "layout-shift",
        buffered: true,
      });
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en", { waitUntil: "networkidle" });
    await ready(page);
    await expect(page.locator(".hero-actions")).toHaveCSS("opacity", "1");
    const box = () => page.locator(".hero-slider").boundingBox();
    const before = await box();
    for (const name of ["Show Striploin Steak", "Show Rump Steak", "Show Ribeye Steak"]) {
      await page.getByRole("button", { name }).click();
      expect(await box()).toEqual(before);
    }
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThan(0.01);
  });
});
