import { expect, test, type Page } from "@playwright/test";

// The styleguide is development-only (404 on every deployment), so these checks run against a
// `next dev` server (playwright.config.ts, project "styleguide"). They use the styleguide's demo
// surfaces and interaction kit; the production build is covered by the other specs.

const headerTheme = (page: Page) => page.locator("header.site-header").getAttribute("data-theme");

async function scrollToSelector(page: Page, selector: string, offset = 120) {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string)!;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (off as number), behavior: "instant" });
    },
    [selector, offset],
  );
  await page.waitForTimeout(350);
}

test.describe("header", () => {
  test("switches colours with the surface underneath (styleguide)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/styleguide");
    await expect.poll(() => headerTheme(page)).toBe("dark");
    await scrollToSelector(page, "#colors", 10);
    await page.mouse.wheel(0, -1); // keep header visible
    await expect.poll(() => headerTheme(page)).toBe("dark");
    await scrollToSelector(page, "#kit ~ section[data-surface=light]", 10);
    await expect.poll(() => headerTheme(page)).toBe("light");
    await scrollToSelector(page, "#kit", 10);
    await expect.poll(() => headerTheme(page)).toBe("dark");
    await scrollToSelector(page, "main > div > section[data-surface=kraft]", 10);
    await expect.poll(() => headerTheme(page)).toBe("light");
    await scrollToSelector(page, "#site-footer", 10);
    await expect.poll(() => headerTheme(page)).toBe("dark");
  });

  test("hides on scroll down, returns on scroll up", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/styleguide");
    const header = page.locator("header.site-header");
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(600);
    const hiddenBox = await header.boundingBox();
    expect(hiddenBox!.y).toBeLessThan(-hiddenBox!.height + 2);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(600);
    expect((await header.boundingBox())!.y).toBeGreaterThanOrEqual(-1);
  });
});

test.describe("language", () => {
  test("switch keeps page and scroll position; Khmer uses Noto Sans Khmer", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/styleguide");
    await scrollToSelector(page, "#type", 0);
    await page.mouse.wheel(0, -60); // scroll up a little: header comes back
    await page.waitForTimeout(400);
    const before = await page.evaluate(() => window.scrollY);
    await page.getByRole("link", { name: "ភាសាខ្មែរ" }).first().click();
    await expect(page).toHaveURL(/\/km\/styleguide$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
    await expect
      .poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - before), { timeout: 15_000 })
      .toBeLessThan(400);
    await expect(page.locator("#main-content")).toHaveCount(1);
    const font = await page.locator('#type [lang="km"] > p:last-child').first().evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).toMatch(/Noto Sans Khmer/i);
  });

  test("Khmer type: no clipping, open line-height, no uppercase", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/styleguide");
    const rows = await page.locator('#type [lang="km"] > p:last-child').evaluateAll((els) =>
      els.map((el) => {
        const cs = getComputedStyle(el);
        return {
          cls: el.className,
          font: cs.fontFamily,
          ratio: parseFloat(cs.lineHeight) / parseFloat(cs.fontSize),
          transform: cs.textTransform,
          spacing: cs.letterSpacing,
          clipped: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
        };
      }),
    );
    expect(rows.length).toBe(8);
    for (const r of rows) {
      expect(r.font, r.cls).toMatch(/Noto Sans Khmer/i);
      expect(r.ratio, r.cls).toBeGreaterThanOrEqual(1.3);
      expect(r.transform, r.cls).toBe("none");
      expect(r.spacing === "normal" || parseFloat(r.spacing) >= 0, r.cls).toBe(true);
      expect(r.clipped, r.cls).toBe(false);
    }
  });

  test("switching language keeps the query string and hash", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/styleguide?ref=demo#buttons");
    // The page opened mid-way down. Once hydrated, the header hides itself (it saw a jump down),
    // and it can only react to a scroll up after hydration. So wait for hydration (the page marks
    // <html> "motion-ready"), scroll up a little, then wait until the header is back on screen.
    await page.waitForFunction(() => document.documentElement.classList.contains("motion-ready"));
    await page.mouse.wheel(0, -60);
    await expect.poll(async () => (await page.locator("header.site-header").boundingBox())!.y).toBeGreaterThanOrEqual(-1);
    await page.getByRole("link", { name: "ភាសាខ្មែរ" }).first().click();
    await expect(page).toHaveURL(/\/km\/styleguide\?ref=demo#buttons$/);
  });
});

test.describe("interaction kit", () => {
  test("carousel works with arrow keys and buttons", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/en/styleguide");
    const region = page.getByRole("region", { name: "Carousel" });
    await region.scrollIntoViewIfNeeded();
    await region.focus();
    const current = () => region.locator("xpath=..").locator('[aria-live="polite"]').textContent();
    expect(await current()).toBe("1 of 6");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect.poll(current).toBe("3 of 6");
    await page.keyboard.press("End");
    await expect.poll(current).toBe("6 of 6");
    await expect(page.getByRole("button", { name: "Next slide" })).toBeDisabled();
    await page.getByRole("button", { name: "Previous slide" }).click();
    await expect.poll(current).toBe("5 of 6");
    await region.focus();
    await page.keyboard.press("Home");
    await expect.poll(current).toBe("1 of 6");
  });

  test("parallax image never shows an edge while scrolling", async ({ page }) => {
    for (const [width, height] of [[390, 844], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      await page.goto("/en/styleguide");
      const layer = page.locator("#kit ~ section .absolute.inset-x-0").first();
      const frame = layer.locator("..");
      await frame.scrollIntoViewIfNeeded();
      const top = await frame.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      // Walk the frame from just below the viewport to just above it.
      for (let s = top - height; s <= top + 400; s += 120) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), s);
        await page.waitForTimeout(40);
        const gap = await layer.evaluate((el) => {
          const l = el.getBoundingClientRect();
          const f = el.parentElement!.getBoundingClientRect();
          return { top: l.top - f.top, bottom: f.bottom - l.bottom };
        });
        expect(gap.top, `top edge @${width}px, scroll ${s}`).toBeLessThanOrEqual(0.5);
        expect(gap.bottom, `bottom edge @${width}px, scroll ${s}`).toBeLessThanOrEqual(0.5);
      }
    }
  });

  test("Tab into an off-screen slide scrolls the carousel to it", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/en/styleguide");
    const region = page.getByRole("region", { name: "Carousel" });
    await region.scrollIntoViewIfNeeded();
    await region.focus();
    const current = () => region.locator("xpath=..").locator('[aria-live="polite"]').textContent();
    await page.keyboard.press("Tab"); // slide 1's link
    await expect.poll(current).toBe("1 of 6");
    for (let i = 0; i < 3; i++) await page.keyboard.press("Tab"); // slide 4's link
    const focused = page.locator(":focus");
    await expect(focused).toHaveText("Details");
    await expect.poll(current).toBe("4 of 6");
    // The focused link ends up on screen, inside the carousel's visible area.
    await expect
      .poll(async () => {
        const link = (await focused.boundingBox())!;
        const area = (await region.boundingBox())!;
        return link.x >= area.x && link.x + link.width <= area.x + area.width;
      })
      .toBe(true);
    // Shift+Tab goes back a slide.
    await page.keyboard.press("Shift+Tab");
    await expect.poll(current).toBe("3 of 6");
  });

  test("desktop: cursor follower shows labels, tilt and magnetic move", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/styleguide");
    const target = page.locator('[data-cursor="explore"]').first();
    await target.scrollIntoViewIfNeeded();
    await target.hover();
    await expect(page.locator(".z-\\[100\\]").getByText("Explore", { exact: true })).toBeVisible();

    const tilt = page.locator("#kit .isolate").first();
    await tilt.scrollIntoViewIfNeeded();
    const box = (await tilt.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.1, { steps: 5 });
    await page.waitForTimeout(400);
    expect(await tilt.evaluate((el) => getComputedStyle(el).transform)).not.toBe("none");
  });

  test("reduced motion: no follower, no marquee/parallax movement, text not shifted", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/en/styleguide");
    await page.waitForTimeout(300);
    await page.mouse.move(400, 400);
    await page.mouse.move(420, 420);
    await expect(page.locator(".pointer-events-none.fixed.z-\\[100\\]")).toHaveCount(0);

    // Marquee stays put.
    const strip = page.locator("[data-surface=kraft] .w-max").first();
    await strip.scrollIntoViewIfNeeded();
    const t1 = await strip.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(800);
    const t2 = await strip.evaluate((el) => getComputedStyle(el).transform);
    expect(t1).toBe(t2);

    // Parallax image doesn't drift.
    const parallax = page.locator("#kit ~ section .absolute.inset-x-0").first();
    await parallax.scrollIntoViewIfNeeded();
    const p1 = await parallax.evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(300);
    const p2 = await parallax.evaluate((el) => getComputedStyle(el).transform);
    expect(p1).toBe(p2);

    // Split text: letters end without any transform; CountUp shows 72 straight away.
    await scrollToSelector(page, "#kit");
    await page.waitForTimeout(600);
    const shifted = await page.locator("#kit p.display-xl span.inline-block").evaluateAll((els) =>
      els.some((el) => {
        const tr = getComputedStyle(el).transform;
        return tr !== "none" && tr !== "matrix(1, 0, 0, 1, 0, 0)";
      }),
    );
    expect(shifted).toBe(false);
    await scrollToSelector(page, "[data-surface=kraft]");
    await expect(page.locator("[data-surface=kraft] .display-hero [aria-hidden]")).toHaveText("72");
    await context.close();
  });

  test("touch: no follower, tilt or magnet; carousel swipes", async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto("/en/styleguide");
    await page.waitForTimeout(300);
    await expect(page.locator(".pointer-events-none.fixed.z-\\[100\\]")).toHaveCount(0);
    const fine = await page.evaluate(() => matchMedia("(hover: hover) and (pointer: fine)").matches);
    expect(fine).toBe(false);

    const tilt = page.locator("#kit .isolate").first();
    await tilt.scrollIntoViewIfNeeded();
    await tilt.tap();
    expect(await tilt.evaluate((el) => getComputedStyle(el).transform)).toBe("none");

    const region = page.getByRole("region", { name: "Carousel" });
    await region.scrollIntoViewIfNeeded();
    // Drag arrives with Motion's larger feature set, loaded as the carousel nears the screen.
    await expect(page.locator('[data-motion-max="ready"]').filter({ has: region })).toBeAttached();
    const box = (await region.boundingBox())!;
    const y = box.y + box.height / 2;
    const cdp = await context.newCDPSession(page);
    const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number) =>
      cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
    await touch("touchStart", 320);
    for (let x = 300; x >= 80; x -= 20) await touch("touchMove", x);
    await touch("touchEnd", 80);
    await expect.poll(() => region.locator("xpath=..").locator('[aria-live="polite"]').textContent()).not.toBe("1 of 6");
    await context.close();
  });
});

test.describe("reveals", () => {
  test("without JavaScript, in-view reveals are visible", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/en/styleguide");
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll("[data-reveal], [data-reveal-item], [data-piece]")].filter((el) => {
        const cs = getComputedStyle(el);
        return cs.opacity !== "1" || cs.clipPath.startsWith("inset(100%");
      }).length,
    );
    expect(hidden).toBe(0);
    await context.close();
  });

  test("with JavaScript, in-view reveals end visible after scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/styleguide");
    for (let y = 0; y < 30; y++) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(1600);
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll("[data-reveal='fade'], [data-reveal-group] > [data-reveal-item], [data-reveal='clip'], [data-reveal='pop']")]
        .filter((el) => {
          const cs = getComputedStyle(el);
          const scaledAway = cs.transform.startsWith("matrix(0,") || cs.transform.startsWith("matrix(0.");
          return cs.opacity !== "1" || cs.clipPath.startsWith("inset(100%") || scaledAway;
        })
        .map((el) => el.className),
    );
    expect(hidden).toEqual([]);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

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
