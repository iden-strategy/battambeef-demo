import { expect, test } from "@playwright/test";

// The Day 5 pages: About, For Business, Beef Knowledge, Contact, 404, plus page-wide polish.

test.describe("beef knowledge", () => {
  test("cooking method tabs: arrow keys switch the guide and its cuts link to the cut map", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-knowledge#cooking-methods");
    const tabs = page.getByRole("tablist", { name: "Cooking methods" });
    await expect(tabs.getByRole("tab")).toHaveCount(6);
    await expect(tabs.getByRole("tab", { name: "Grill" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("High, direct heat");

    await tabs.getByRole("tab", { name: "Grill" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.getByRole("tab", { name: "Pan-sear" })).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(tabs.getByRole("tab", { name: "Soup" })).toHaveAttribute("aria-selected", "true");
    const panel = page.getByRole("tabpanel");
    await expect(panel).toContainText("simmering");
    // Soup cuts: brisket, shin, heel muscle and soup bones, from cuts.ts.
    const brisket = panel.getByRole("link", { name: "Brisket: see it on the cut map" });
    await expect(brisket).toHaveAttribute("href", "/en/beef-cuts#brisket");
    await expect(panel.getByRole("link", { name: "Shin (fore and hind): see it on the cut map" })).toHaveAttribute("href", "/en/beef-cuts#fore-shank");
    // Soup bones are not on the map: the link goes to the grid and says so.
    await expect(panel.getByRole("link", { name: "Soup bones (leg, neck, hip): see it in all cuts" })).toHaveAttribute("href", "/en/beef-cuts#all-cuts");
  });

  test("recipe dialog: opens from the card, shows ingredients and steps, Escape closes, focus returns", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-knowledge#recipes");
    const open = page.getByRole("button", { name: "View recipe: Beef lok lak" });
    await open.scrollIntoViewIfNeeded();
    await open.click();
    const dialog = page.getByRole("dialog", { name: "Beef lok lak" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Ingredients" })).toBeVisible();
    await expect(dialog.getByRole("listitem")).toHaveCount(7 + 5);
    await expect(dialog).toContainText("400 g topside");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(open).toBeFocused();
  });

  test("a side card in the carousel moves to the centre instead of opening", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-knowledge#recipes");
    const region = page.getByRole("region", { name: "Recipes", exact: true });
    await region.scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "View recipe: Pan-seared ribeye" }).click({ force: true });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(region.locator("xpath=..").locator('[aria-live="polite"]')).toHaveText("2 of 4");
  });

  test("FAQ accordion opens one answer at a time", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/beef-knowledge#faq");
    const q1 = page.getByRole("button", { name: "Where does BattamBeef come from?" });
    const q2 = page.getByRole("button", { name: "Do you deliver?" });
    await q1.click();
    await expect(q1).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("raised in Battambang province and processed")).toBeVisible();
    await q2.click();
    await expect(q2).toHaveAttribute("aria-expanded", "true");
    await expect(q1).toHaveAttribute("aria-expanded", "false");
  });

  test("quick links go to the sections on the page and to Beef Cuts", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/beef-knowledge");
    const nav = page.getByRole("navigation", { name: "Jump to" });
    await expect(nav.getByRole("link", { name: /Cut guide/ })).toHaveAttribute("href", "/en/beef-cuts");
    await nav.getByRole("link", { name: /Storage/ }).click();
    await expect(page).toHaveURL(/\/en\/beef-knowledge#storage$/);
    await expect(page.locator("#storage-heading")).toBeInViewport();
  });
});

const ALL_PAGES = ["", "/about", "/farm-to-table", "/beef-cuts", "/for-business", "/beef-knowledge", "/contact"];

test.describe("polish", () => {
  test("every page: own title and description, Open Graph image, noindex", async ({ page }) => {
    // Read in the browser: pages rendered on request (404) stream their metadata in with
    // JavaScript (link-preview bots get it in the HTML head).
    const titles = new Set<string>();
    for (const locale of ["en", "km"]) {
      for (const path of [...ALL_PAGES, "/no-such-page"]) {
        const res = (await page.goto(`/${locale}${path}`))!;
        await expect(page).toHaveTitle(/BattamBeef/);
        const metas = await page.evaluate(() =>
          Object.fromEntries(
            [...document.querySelectorAll("meta[name], meta[property]")].map((m) => [
              m.getAttribute("name") ?? m.getAttribute("property"),
              m.getAttribute("content"),
            ]),
          ),
        );
        const meta = (name: string) => metas[name] ?? null;
        const title = await page.title();
        expect(title, path).toMatch(/ · BattamBeef$/);
        expect(meta("description"), path).toBeTruthy();
        expect(meta("og:title"), path).toBeTruthy();
        expect(meta("og:image"), path).toMatch(/\/images\/og\/og-placeholder\.jpg$/);
        expect(meta("og:image:alt"), path).toBeTruthy();
        expect(meta("robots"), path).toContain("noindex");
        expect(res.headers()["x-robots-tag"], path).toContain("noindex");
        if (locale === "en") titles.add(title);
      }
    }
    expect(titles.size, "every page has its own title").toBe(ALL_PAGES.length + 1);
  });

  test("404: brand message with links home and to the cuts", async ({ page }) => {
    const res = await page.goto("/en/no-such-page");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Holy Cow. This page isn't here." })).toBeVisible();
    await expect(page).toHaveTitle("Page not found · BattamBeef");
    const main = page.locator("#main-content");
    await expect(main.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/en");
    await main.getByRole("link", { name: "Explore our cuts" }).click();
    await expect(page).toHaveURL(/\/en\/beef-cuts$/);
  });

  for (const width of [360, 768, 1440, 1920]) {
    test(`${width}px: big placeholder words fit their cards (Home, About, Beef Knowledge)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/en", "/en/about", "/en/beef-knowledge"]) {
        await page.goto(path);
        const result = await page.evaluate(() => {
          const words = [...document.querySelectorAll<HTMLElement>(".placeholder-word")];
          const over = words.flatMap((el) => {
            const box = el.closest(".placeholder-fit")!;
            const b = box.getBoundingClientRect();
            const right = b.right - parseFloat(getComputedStyle(box).paddingRight) + 1;
            const range = document.createRange();
            range.selectNodeContents(el);
            return [...range.getClientRects()].some((r) => r.right > right) ? [el.textContent] : [];
          });
          return { count: words.length, over };
        });
        expect(result.count, path).toBeGreaterThan(0);
        expect(result.over, path).toEqual([]);
      }
    });
  }
});

test.describe("walkthroughs", () => {
  for (const path of ALL_PAGES) {
    test(`keyboard only: every Tab stop on ${path || "/"} is on screen with a visible focus ring`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/en${path}`);
      await page.waitForFunction(() => document.documentElement.classList.contains("motion-ready"));
      const problems: string[] = [];
      const seen: string[] = [];
      for (let i = 0; i < 300; i++) {
        await page.keyboard.press("Tab");
        const info = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const r = el.getBoundingClientRect();
          const ring = (cs: CSSStyleDeclaration) => cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
          const visibleRing = ring(getComputedStyle(el)) || ring(getComputedStyle(el, "::after"));
          const label = `${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)}"`;
          return {
            label,
            key: `${label}@${Math.round(r.top + window.scrollY)}:${Math.round(r.left)}`,
            visibleRing,
            onScreen: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight,
            tabIndex: el.tabIndex,
          };
        });
        if (!info) break;
        if (seen.includes(info.key)) break; // wrapped around
        seen.push(info.key);
        if (!info.visibleRing) problems.push(`no focus ring: ${info.label}`);
        if (!info.onScreen) problems.push(`off screen: ${info.label}`);
        if (info.tabIndex > 0) problems.push(`positive tabindex: ${info.label}`);
      }
      expect(seen.length, "reaches the footer").toBeGreaterThan(15);
      expect(problems).toEqual([]);
    });

    test(`reduced motion: ${path || "/"} ends fully visible, nothing moves`, async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      await page.goto(`/en${path}`);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < height; y += 500) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(80);
      }
      await page.waitForTimeout(800);
      const hidden = await page.evaluate(() =>
        [...document.querySelectorAll("[data-reveal], [data-reveal-group] > [data-reveal-item], [data-piece]")]
          .filter((el) => {
            const cs = getComputedStyle(el);
            return cs.opacity !== "1" || cs.clipPath.startsWith("inset(100%") || (cs.transform !== "none" && !cs.transform.startsWith("matrix(1, 0, 0, 1, 0, 0)"));
          })
          .map((el) => el.className.toString().slice(0, 60)),
      );
      expect(hidden).toEqual([]);
      // Marquee strips stay still.
      const strips = page.locator('[aria-hidden="true"].flex.w-max');
      for (const strip of await strips.all()) {
        const a = await strip.evaluate((el) => getComputedStyle(el).transform);
        await page.waitForTimeout(300);
        expect(await strip.evaluate((el) => getComputedStyle(el).transform)).toBe(a);
      }
      await context.close();
    });
  }
});

test.describe("no sideways scroll", () => {
  for (const path of ["about", "for-business", "beef-knowledge", "contact"]) {
    for (const width of [360, 390, 768, 1440]) {
      test(`/en/${path} at ${width}px has no horizontal page scroll`, async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await page.goto(`/en/${path}`);
        await page.waitForLoadState("networkidle");
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over).toBeLessThanOrEqual(0);
      });
    }
  }
});
