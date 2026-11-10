import { expect, test, type Page } from "@playwright/test";

const PARTS = ["Neck", "Chuck", "Rib", "Loin", "Rump", "Round", "Brisket", "Plate", "Flank", "Fore shank", "Hind shank"];
const selectedChip = (page: Page) => page.locator("#cut-map [aria-pressed='true']");
const cards = (page: Page) => page.locator("#all-cuts ul.grid > li");

test.describe("cut map", () => {
  test("a hash link preselects a part, the default is Rib", async ({ page }) => {
    await page.goto("/en/beef-cuts");
    await expect(selectedChip(page)).toContainText("Rib");
    await page.goto("/en/beef-cuts#loin");
    await expect(selectedChip(page)).toContainText("Loin");
    await expect(page.locator("#cut-map h3")).toHaveText("Loin");
  });

  test("switching language keeps the selected part in the hash", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts");
    await page.locator("#cut-map [aria-pressed]", { hasText: "Brisket" }).click();
    await expect(page).toHaveURL(/#brisket$/);
    await expect(page.getByRole("link", { name: "ភាសាខ្មែរ" }).first()).toHaveAttribute("href", "/km/beef-cuts#brisket");
  });

  test("the chip row is the keyboard interface: every part can be selected", async ({ page }) => {
    await page.goto("/en/beef-cuts");
    await selectedChip(page).focus();
    await page.keyboard.press("Home");
    for (const name of PARTS) {
      await page.keyboard.press("Enter");
      await expect(selectedChip(page)).toContainText(name);
      await expect(page.locator("#cut-map h3")).toHaveText(name);
      await page.keyboard.press("ArrowRight");
    }
    await expect(page).toHaveURL(/#hind-shank$/);
    // Roving tabindex: exactly one chip in the tab order.
    const tabStops = await page.locator("#cut-map [aria-pressed]").evaluateAll((els) => els.filter((e) => (e as HTMLElement).tabIndex === 0).length);
    expect(tabStops).toBe(1);
  });

  test("clicking the map selects a part and updates the hash", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts");
    const box = (await page.locator("#cut-map svg").boundingBox())!;
    const s = box.width / 1420;
    await page.mouse.click(box.x + 1200 * s, box.y + 500 * s); // round
    await expect(selectedChip(page)).toContainText("Round");
    await expect(page).toHaveURL(/#round$/);
  });

  test("all 20 cuts are in the grid and in their own cow part(s)", async ({ page }) => {
    await page.goto("/en/beef-cuts");
    await expect(cards(page)).toHaveCount(20);
    // Shin is in both shanks; trimmings and soup bones are in no part (grid only).
    const expected: Record<string, number> = { Neck: 1, Chuck: 3, Rib: 2, Loin: 2, Rump: 1, Round: 4, Brisket: 1, Plate: 1, Flank: 1, "Fore shank": 1, "Hind shank": 2 };
    for (const [name, count] of Object.entries(expected)) {
      await page.locator("#cut-map [aria-pressed]", { hasText: name }).click();
      await expect(page.locator("#cut-map ul.divide-y > li")).toHaveCount(count);
      await page.getByRole("group", { name: "Cow part" }).getByRole("button", { name, exact: true }).click();
      await expect(cards(page)).toHaveCount(count);
    }
    for (const name of ["Fore shank", "Hind shank"]) {
      await page.locator("#cut-map [aria-pressed]", { hasText: name }).click();
      await expect(page.locator("#cut-map ul.divide-y > li", { hasText: "Shin (fore and hind)" })).toHaveCount(1);
    }
    // The grid keeps the cow order, bones and trimmings last.
    await page.getByRole("group", { name: "Cow part" }).getByRole("button", { name: "All", exact: true }).click();
    const names = await cards(page).locator("span[lang=en]").allTextContents();
    expect(names.at(0)).toBe("Neck / chuck");
    expect(names.slice(-2)).toEqual(["Trimmings for mince", "Soup bones (leg, neck, hip)"]);
  });

  test("cut photos: 4:3 WebP in cards and dialog; card photos decorative, the dialog's described", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts");
    const ratio = (box: { width: number; height: number } | null) => box!.width / box!.height;
    const card = page.locator("#all-cuts ul.grid > li button", { hasText: "Ribeye" });
    await card.scrollIntoViewIfNeeded();
    const cardImg = card.locator("img");
    await expect(cardImg).toHaveAttribute("alt", "");
    await expect(cardImg).toHaveAttribute("src", /cuts%2Fribeye\.webp/);
    expect(ratio(await cardImg.boundingBox())).toBeCloseTo(4 / 3, 1);
    // Every cut has a photo: no "Photo coming soon" tiles left.
    await expect(page.locator("#all-cuts").getByText("Photo coming soon")).toHaveCount(0);

    await card.click();
    const dialogImg = page.getByRole("dialog").getByRole("img", { name: "A raw, marbled ribeye steak on butcher paper" });
    await expect(dialogImg).toBeVisible();
    await expect.poll(async () => ratio(await dialogImg.boundingBox())).toBeCloseTo(4 / 3, 1);
  });

  test("cut detail for a two-part cut and for a cut that is not on the map", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts");
    const dialog = page.getByRole("dialog");

    // Shin: both parts named; "Show on the cow" selects the first.
    const shin = page.locator("#all-cuts ul.grid > li button", { hasText: "Shin" });
    await shin.scrollIntoViewIfNeeded();
    await shin.click();
    await expect(dialog.getByText("2360 · Parts 10 and 11 of 11")).toBeVisible();
    await expect(dialog.getByText("From the Fore shank and Hind shank. Tier: Slow-cook.")).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Request a quote" })).toHaveAttribute("href", "/en/contact?part=fore-shank&cut=shin");
    await dialog.getByRole("button", { name: "Show on the cow" }).click();
    await expect(selectedChip(page)).toContainText("Fore shank");

    // Soup bones: no part line, no "Show on the cow", quote link carries only the cut.
    const bones = page.locator("#all-cuts ul.grid > li button", { hasText: "Soup bones" });
    await bones.scrollIntoViewIfNeeded();
    await expect(bones.locator(".label.text-label")).toHaveText("Slow-cook");
    await bones.click();
    await expect(dialog.getByRole("heading", { name: "Soup bones (leg, neck, hip)" })).toBeVisible();
    await expect(dialog.getByText(/^Part/)).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Show on the cow" })).toHaveCount(0);
    await expect(dialog.getByRole("link", { name: "Request a quote" })).toHaveAttribute("href", "/en/contact?cut=soup-bones");
  });

  test("filters combine", async ({ page }) => {
    await page.goto("/en/beef-cuts");
    await page.getByRole("group", { name: "Tier" }).getByRole("button", { name: "Premium" }).click();
    await page.getByRole("group", { name: "Cooking method" }).getByRole("button", { name: "Roast" }).click();
    await expect(page.locator("#all-cuts [role=status]")).toHaveText("Showing 2 of 20 cuts");
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(cards(page)).toHaveCount(20);
  });

  test("cut detail: opens, traps focus, closes with Escape / close / backdrop, focus returns", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts");
    const card = page.locator("#all-cuts ul.grid > li button", { hasText: "Ribeye" });
    await card.scrollIntoViewIfNeeded();
    // The card → detail morph needs the grid's layout features (loaded as it nears the screen).
    await expect(page.locator('#all-cuts [data-motion-max="ready"]')).toBeAttached();

    await card.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("heading", { name: "Ribeye (cube roll)" })).toBeVisible();
    expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();

    await card.click();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();

    await card.click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(10, 450);
    await expect(dialog).toHaveCount(0);
  });

  test("below-the-fold sections render on approach; links, scrolling and card animations still work", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/beef-cuts#all-cuts");
    // The grid, by-products and quote sections are deferred; the intro and map are not.
    const cv = await page.locator("main section").evaluateAll((els) => els.map((e) => getComputedStyle(e).contentVisibility));
    expect(cv).toEqual(["visible", "visible", "auto", "auto", "auto"]);
    // #all-cuts link: lands at the grid, just under the header.
    const gridTop = () => page.evaluate(() => Math.round(document.getElementById("all-cuts")!.getBoundingClientRect().top));
    await expect.poll(gridTop).toBeLessThan(120);
    expect(await gridTop()).toBeGreaterThan(0);
    await expect(page.locator("#all-cuts-heading")).toBeInViewport();
    await expect(cards(page).first()).toBeInViewport();

    // Card layout animation still runs when a filter changes the grid (once its features have
    // arrived: MotionMaxProvider loads them as the grid nears the screen).
    await expect(page.locator('#all-cuts [data-motion-max="ready"]')).toBeAttached();
    await page.evaluate(() => {
      const w = window as unknown as { __moved: Set<string>; __stop: boolean };
      w.__moved = new Set();
      w.__stop = false;
      const tick = () => {
        document.querySelectorAll<HTMLElement>("#all-cuts ul.grid > li").forEach((li) => {
          const t = getComputedStyle(li).transform;
          if (t !== "none" && t !== "matrix(1, 0, 0, 1, 0, 0)") w.__moved.add(li.textContent ?? "");
        });
        if (!w.__stop) requestAnimationFrame(tick);
      };
      tick();
    });
    await page.getByRole("group", { name: "Tier" }).getByRole("button", { name: "Premium" }).click();
    await page.waitForTimeout(700);
    const moved = await page.evaluate(() => {
      const w = window as unknown as { __moved: Set<string>; __stop: boolean };
      w.__stop = true;
      return w.__moved.size;
    });
    expect(moved).toBeGreaterThan(0);
    // Settled: every remaining card fully shown, no leftover transform.
    const settled = await cards(page).evaluateAll((els) => els.map((e) => [getComputedStyle(e).opacity, getComputedStyle(e).transform]));
    for (const [opacity, transform] of settled) {
      expect(opacity).toBe("1");
      expect(transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)").toBe(true);
    }

    // "See all [part] cuts" from the map: the grid comes into view.
    await page.goto("/en/beef-cuts#loin");
    await page.getByRole("button", { name: "See all Loin cuts" }).click();
    await expect(page.locator("#all-cuts-heading")).toBeFocused();
    await expect(page.locator("#all-cuts-heading")).toBeInViewport();
    await expect(page.locator("#all-cuts [role=status]")).toHaveText("Showing 2 of 20 cuts");

    // The header still follows the surface under it over the deferred kraft section. Fresh page,
    // so no smooth scroll or exit animation from the steps above is still moving things.
    await page.goto("/en/beef-cuts");
    // Put the kraft section under the header's middle line; sections above may still settle to
    // their real size as they render, so each attempt re-aims before reading the header.
    const themeOverKraft = async () => {
      await page.evaluate(() => {
        const kraft = document.querySelector("[data-surface=kraft]")!;
        window.scrollTo({ top: kraft.getBoundingClientRect().top + scrollY + 150, behavior: "instant" });
      });
      await page.waitForTimeout(150);
      return page.locator("header.site-header").getAttribute("data-theme");
    };
    await expect.poll(themeOverKraft, { timeout: 8000 }).toBe("light");
  });

  test("cut detail: a failed load shows a note with Try again, never the error page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts");
    const card = page.locator("#all-cuts ul.grid > li button", { hasText: "Ribeye" });
    await card.scrollIntoViewIfNeeded();
    await page.waitForLoadState("networkidle"); // the grid's own on-demand chunks are in

    // From now on every script request fails (the detail dialog's chunk among them).
    let mode: "fail" | "slow" = "fail";
    let failed = 0;
    await page.route(/\/_next\/static\/chunks\/.+\.js(\?.*)?$/, async (route) => {
      if (mode === "fail") {
        failed++;
        return route.abort();
      }
      await new Promise((r) => setTimeout(r, 800));
      return route.continue();
    });

    const errorNote = page.locator("[data-cut-detail-status=error]");
    await card.click();
    await expect(errorNote.getByRole("alert")).toContainText("could not be loaded");
    expect(failed).toBeGreaterThanOrEqual(2); // first try + the automatic retry
    await expect(errorNote.getByRole("button", { name: "Try again" })).toBeFocused();
    await expect(page.getByText("Something went wrong")).toHaveCount(0);
    await expect(cards(page)).toHaveCount(20);

    // Escape closes the note; focus goes back to the card.
    await page.keyboard.press("Escape");
    await expect(errorNote).toHaveCount(0);
    await expect(card).toBeFocused();

    // Close button, same.
    await card.click();
    await errorNote.getByRole("button", { name: "Close" }).click();
    await expect(errorNote).toHaveCount(0);
    await expect(card).toBeFocused();

    // The connection comes back (slowly): Try again shows the loading note, then the dialog.
    await card.click();
    await expect(errorNote).toBeVisible();
    mode = "slow";
    await errorNote.getByRole("button", { name: "Try again" }).click();
    await expect(page.locator("[data-cut-detail-status=loading]").getByRole("status")).toHaveText("Loading cut details…");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Ribeye (cube roll)" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(card).toBeFocused();
  });

  test("'Show on the cow' selects the part and scrolls to the map", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts");
    const card = page.locator("#all-cuts ul.grid > li button", { hasText: "Tenderloin" });
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await page.getByRole("button", { name: "Show on the cow" }).click();
    await expect(selectedChip(page)).toContainText("Loin");
    await expect(selectedChip(page)).toBeFocused();
    await expect.poll(() => page.evaluate(() => document.getElementById("cut-map")!.getBoundingClientRect().top)).toBeLessThan(400);
  });

  test("'See all' filters the grid; quote link carries only the part id", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts#loin");
    await expect(page.getByRole("link", { name: "Request a quote for Loin cuts" })).toHaveAttribute("href", "/en/contact?part=loin");
    await page.getByRole("button", { name: "See all Loin cuts" }).click();
    await expect(page.locator("#all-cuts [role=status]")).toHaveText("Showing 2 of 20 cuts");
    // Focus moves to the grid heading (a script-only focus target), not back to the panel button.
    await expect(page.locator("#all-cuts-heading")).toBeFocused();
  });

  test("touch: tapping the small shank regions selects them; chips scroll inside their row", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto("/en/beef-cuts");
    await page.locator("#cut-map svg").scrollIntoViewIfNeeded();
    const box = (await page.locator("#cut-map svg").boundingBox())!;
    const s = box.width / 1420;
    for (const [name, x, y] of [["Fore shank", 520, 760], ["Hind shank", 1160, 775]] as const) {
      await page.touchscreen.tap(box.x + x * s, box.y + y * s);
      await expect(selectedChip(page)).toContainText(name);
    }
    const sizes = await page.locator("#cut-map [role=group]").evaluate((r) => ({ scroll: r.scrollWidth, client: r.clientWidth, page: document.documentElement.scrollWidth - innerWidth }));
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    expect(sizes.page).toBeLessThanOrEqual(0);
    await ctx.close();
  });

  test("badge tap targets are at least 44px at 360px; a tapped far chip is fully visible", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto("/en/beef-cuts");
    await page.locator("#cut-map svg").scrollIntoViewIfNeeded();
    const sizes = await page.locator("#cut-map circle[data-hit]").evaluateAll((els) => els.map((e) => Math.min(e.getBoundingClientRect().width, e.getBoundingClientRect().height)));
    expect(sizes).toHaveLength(11);
    for (const size of sizes) expect(size).toBeGreaterThanOrEqual(44);
    // Select the last part from the map: its chip scrolls into the row, centred and not cut off.
    const box = (await page.locator("#cut-map svg").boundingBox())!;
    await page.touchscreen.tap(box.x + 1160 * (box.width / 1420), box.y + 775 * (box.width / 1420));
    await expect(selectedChip(page)).toContainText("Hind shank");
    await expect.poll(async () => {
      const chip = (await selectedChip(page).boundingBox())!;
      const row = (await page.locator("#cut-map [role=group]").boundingBox())!;
      return chip.x >= row.x - 1 && chip.x + chip.width <= row.x + row.width + 1;
    }).toBe(true);
    await ctx.close();
  });

  test("a 360px phone downloads a small image variant of the map photo", async ({ browser }) => {
    // `screen` too: with the default desktop screen the browser first picks the image as if it were on a 1920px display.
    const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, screen: { width: 360, height: 800 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const widths: number[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.pathname === "/_next/image" && (u.searchParams.get("url") ?? "").includes("cow-cutmap")) widths.push(Number(u.searchParams.get("w")));
    });
    await page.goto("/en/beef-cuts", { waitUntil: "networkidle" });
    expect(widths.length).toBeGreaterThan(0);
    for (const w of widths) expect(w).toBeLessThanOrEqual(384); // 320 CSS px at 1x; the photo itself is 1420px wide
    await ctx.close();
  });

  test("badges stay aligned with the photo at every width", async ({ page }) => {
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/en/beef-cuts");
      const off = await page.evaluate(() => {
        const svg = document.querySelector("#cut-map svg")!;
        const r = svg.getBoundingClientRect();
        const s = r.width / 1420;
        const c = svg.querySelectorAll("circle")[7].getBoundingClientRect(); // loin badge, visible circle, at 970,250
        return Math.hypot(c.left + c.width / 2 - (r.left + 970 * s), c.top + c.height / 2 - (r.top + 250 * s));
      });
      expect(off, `${width}px`).toBeLessThan(1.5);
    }
  });

  test("reduced motion: dialog still opens and closes", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/en/beef-cuts");
    const card = page.locator("#all-cuts ul.grid > li button").first();
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await ctx.close();
  });

  test("Khmer page: cut names are Khmer, no sideways scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/km/beef-cuts#round");
    await expect(page.locator("#cut-map [lang=km]").first()).toBeVisible();
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over).toBeLessThanOrEqual(0);
  });
});
