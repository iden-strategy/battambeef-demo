import { expect, test, type Page } from "@playwright/test";

// The reveal kit runs on browser-native animations (motion/mini) and the header slide is a CSS
// transition. These checks pin the timings and easing to the motion tokens (CLAUDE.md section 8)
// and confirm reduced motion: fades only, nothing moves.

const EXPO = "cubic-bezier(0.22, 1, 0.36, 1)";

type Timing = { prop: string; duration: number; delay: number; easing: string };

/** Native animations currently on the elements matching `selector`. */
function timings(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((els) =>
    els.flatMap((el) =>
      el.getAnimations().map((a) => {
        const t = (a.effect as KeyframeEffect).getTiming();
        const kf = (a.effect as KeyframeEffect).getKeyframes();
        const prop = Object.keys(kf[0] ?? {}).find((k) => !["offset", "easing", "composite", "computedOffset"].includes(k)) ?? "";
        return { prop, duration: Number(t.duration), delay: Number(t.delay), easing: String(t.easing) };
      }),
    ),
  ) as Promise<Timing[]>;
}

async function scrollIntoMiddle(page: Page, selector: string) {
  await page.locator(selector).first().evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
}

test.describe("motion kit: timings unchanged", () => {
  test("Reveal stagger: 0.8s expo-out fade-up, 90ms apart (Farm to Table result tiles)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/farm-to-table", { waitUntil: "networkidle" });
    await scrollIntoMiddle(page, "[aria-labelledby='result-heading'] ul");
    await expect.poll(async () => (await timings(page, "[aria-labelledby='result-heading'] ul > li")).length).toBeGreaterThan(0);
    const t = await timings(page, "[aria-labelledby='result-heading'] ul > li");
    const opacity = t.filter((x) => x.prop === "opacity");
    const transform = t.filter((x) => x.prop === "transform");
    expect(opacity).toHaveLength(4);
    expect(transform).toHaveLength(4);
    for (const x of t) {
      expect(x.duration).toBe(800);
      expect(x.easing).toBe(EXPO);
    }
    expect(opacity.map((x) => x.delay)).toEqual([0, 90, 180, 270]);
    // Finished: fully visible, back in place.
    await expect
      .poll(() => page.locator("[aria-labelledby='result-heading'] ul > li").evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity + "|" + getComputedStyle(e).transform)))
      .toEqual(Array(4).fill("1|none"));
  });

  test("ImageReveal: 1.1s expo-out clip wipe and scale (Farm to Table stage photo)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/farm-to-table", { waitUntil: "networkidle" });
    await scrollIntoMiddle(page, "[data-block]:nth-child(2) [data-reveal='clip']");
    const sel = "[data-block]:nth-child(2) [data-reveal='clip'], [data-block]:nth-child(2) [data-reveal='clip'] > div";
    await expect.poll(async () => (await timings(page, sel)).length).toBe(2);
    const t = await timings(page, sel);
    expect(t.map((x) => x.prop).sort()).toEqual(["clipPath", "transform"]);
    for (const x of t) {
      expect(x.duration).toBe(1100);
      expect(x.easing).toBe(EXPO);
    }
  });

  test("SplitTextReveal in view: 0.9s expo-out letters, 35ms apart", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/farm-to-table", { waitUntil: "networkidle" });
    await scrollIntoMiddle(page, "#result-heading");
    const sel = "#result-heading [data-piece]";
    await expect.poll(async () => (await timings(page, sel)).length).toBeGreaterThan(0);
    const t = (await timings(page, sel)).filter((x) => x.prop === "opacity");
    expect(t[0].duration).toBe(900);
    expect(t[0].easing).toBe(EXPO);
    expect(t.slice(0, 3).map((x) => x.delay)).toEqual([0, 35, 70]);
  });

  test("header slides 0.35s expo-out", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/about");
    const tr = await page.locator("header.site-header").evaluate((el) => getComputedStyle(el).transition);
    expect(tr).toContain(`transform 0.35s ${EXPO}`);
  });
});

test.describe("motion kit: desktop-only effects are downloaded only with a fine pointer", () => {
  // Markers that exist only in those chunks: the tilt transform (pointer-effects.ts) and the
  // follower ring's halo class (cursor-follower-impl.tsx).
  const MARKERS = ["perspective(900px)", "rgba(41,43,45,0.6)"];

  async function downloaded(page: Page, path: string) {
    const bodies: Promise<string>[] = [];
    page.on("response", (r) => {
      if (r.url().endsWith(".js")) bodies.push(r.text().catch(() => ""));
    });
    await page.goto(path, { waitUntil: "networkidle" });
    await page.mouse.move(200, 200);
    await page.waitForTimeout(500);
    const all = (await Promise.all(bodies)).join("\n");
    return MARKERS.map((m) => all.includes(m));
  }

  test("touch phone: never downloaded", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    expect(await downloaded(page, "/en/beef-cuts")).toEqual([false, false]);
    await ctx.close();
  });

  test("desktop mouse: downloaded", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    expect(await downloaded(page, "/en/beef-cuts")).toEqual([true, true]);
  });
});

test.describe("beef cuts: the cut detail dialog loads on demand", () => {
  test("touch phone: not downloaded at load; the first tap still opens it", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const urls: string[] = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".js")) urls.push(r.url());
    });
    await page.goto("/en/beef-cuts", { waitUntil: "networkidle" });
    const atLoad = urls.length;
    const card = page.locator("#all-cuts ul.grid > li button", { hasText: "Ribeye" });
    await card.scrollIntoViewIfNeeded();
    await card.tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Ribeye (Cube roll)" })).toBeVisible();
    expect(urls.length, "the dialog's code arrives with the first tap").toBeGreaterThan(atLoad);
    await ctx.close();
  });
});

test.describe("motion kit: reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("reveals only fade (0.2s linear), nothing moves, everything ends visible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/farm-to-table", { waitUntil: "networkidle" });
    await scrollIntoMiddle(page, "[aria-labelledby='result-heading'] ul");
    await expect.poll(async () => (await timings(page, "[aria-labelledby='result-heading'] ul > li")).length).toBeGreaterThan(0);
    const t = await timings(page, "[aria-labelledby='result-heading'] ul > li");
    expect(t.every((x) => x.prop === "opacity" && x.duration === 200 && x.easing === "linear")).toBe(true);
    await expect
      .poll(() => page.locator("[aria-labelledby='result-heading'] ul > li").evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity + "|" + getComputedStyle(e).transform)))
      .toEqual(Array(4).fill("1|none"));
  });

  test("header hides instantly (no slide)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/styleguide", { waitUntil: "networkidle" });
    const header = page.locator("header.site-header");
    expect(await header.evaluate((el) => getComputedStyle(el).transition)).not.toContain("transform");
    await page.mouse.wheel(0, 1200);
    await expect(header).toHaveAttribute("data-hidden", "true");
    const box = (await header.boundingBox())!;
    expect(box.y).toBeLessThan(-box.height + 2); // already fully up, no transition in between
  });
});
