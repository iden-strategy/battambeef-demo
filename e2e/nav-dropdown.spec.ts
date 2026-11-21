import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { escapeRegExp, waitForMotionReady } from "./helpers";

// The For Business dropdown in the desktop header (1024px and up): the label stays a link to
// /business, a chevron button next to it shows and hides a panel with Overview · Beef Cuts ·
// Beef Knowledge (disclosure pattern). Below 1024px the mobile menu lists the same three pages,
// indented under For Business.

const SUB = ["Overview", "Beef Cuts", "Beef Knowledge"];
const SUB_PATHS = ["/business", "/business/cuts", "/business/knowledge"];

// Accessible names follow the page language (Khmer names from messages/km.json).
const KM = JSON.parse(readFileSync("messages/km.json", "utf8"));
const isKm = (page: Page) => new URL(page.url()).pathname.startsWith("/km");
const nav = (page: Page) =>
  page.locator("header.site-header").getByRole("navigation", { name: isKm(page) ? KM.nav.label : "Main" });
const topLink = (page: Page) => nav(page).getByRole("link", { name: isKm(page) ? KM.nav.forBusiness : "For Business", exact: true });
const chevron = (page: Page) => nav(page).getByRole("button", { name: isKm(page) ? KM.nav.businessPages : "For Business pages" });
const panel = (page: Page) => page.locator("#forBusiness-menu");
const item = (page: Page) => page.locator("#forBusiness-menu").locator("xpath=..");
const iconWrapper = (page: Page) => page.locator("header.site-header [data-chevron-icon]");

/** Loaded and hydrated: the chevron stays invisible (and unfocusable) until then. */
async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await waitForMotionReady(page);
  await expect(chevron(page)).toBeVisible();
}

/** The open/close animation has finished. */
async function expectSettledOpen(page: Page) {
  await expect(panel(page)).toHaveCSS("opacity", "1");
  await expect(panel(page)).toHaveCSS("transform", "none");
}

async function expectOpen(page: Page) {
  await expect(chevron(page)).toHaveAttribute("aria-expanded", "true");
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole("link")).toHaveCount(3);
}

async function expectClosed(page: Page) {
  await expect(chevron(page)).toHaveAttribute("aria-expanded", "false");
  await expect(panel(page)).toBeHidden();
  // Hidden panels are out of the accessibility tree: no links to find.
  await expect(panel(page).getByRole("link")).toHaveCount(0);
}

test.describe("desktop dropdown", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("chevron is a disclosure button: aria-controls points at the panel, no menu roles", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await expect(chevron(page)).toHaveAttribute("aria-controls", "forBusiness-menu");
    await expect(page.locator("#forBusiness-menu")).toHaveCount(1);
    await expect(page.locator('header [role="menu"], header [role="menuitem"]')).toHaveCount(0);
    await expect(topLink(page)).toHaveAttribute("href", "/en/business");
    await expectClosed(page);
  });

  test("hover opens it, moving into the panel keeps it open, leaving closes it", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await topLink(page).hover();
    await expectOpen(page);
    await expect(item(page)).toHaveAttribute("data-mode", "hover");

    await panel(page).getByRole("link", { name: "Beef Knowledge" }).hover();
    await expectSettledOpen(page);

    // Stays open well past the close delay: watch for any "closed" state on an in-page clock
    // (proving something does NOT happen can only be done by letting time pass).
    await page.evaluate(() => {
      const el = document.getElementById("forBusiness-menu")!.parentElement!;
      const w = window as unknown as { __everClosed: boolean; __t0: number };
      w.__everClosed = false;
      w.__t0 = performance.now();
      new MutationObserver(() => {
        if (el.dataset.state === "closed") w.__everClosed = true;
      }).observe(el, { attributes: true, attributeFilter: ["data-state"] });
    });
    await page.waitForFunction(() => performance.now() - (window as unknown as { __t0: number }).__t0 > 400);
    expect(await page.evaluate(() => (window as unknown as { __everClosed: boolean }).__everClosed)).toBe(false);
    await expectOpen(page);

    await page.mouse.move(20, 600); // the page's side gutter
    await expectClosed(page);
  });

  test("chevron click opens and closes it", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await chevron(page).click();
    await expectOpen(page);
    // A click right after hovering pins it open (no hover timer can close it).
    await expect(item(page)).toHaveAttribute("data-mode", "pinned");
    await chevron(page).click();
    await expectClosed(page);
  });

  test("keyboard: Tab to the chevron, Enter opens, Tab through the links, Escape closes and returns focus", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // logo
    await page.keyboard.press("Tab"); // About
    await page.keyboard.press("Tab");
    await expect(topLink(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(chevron(page)).toBeFocused();
    await expect(chevron(page)).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Enter");
    await expectOpen(page);
    for (const name of SUB) {
      await page.keyboard.press("Tab");
      await expect(panel(page).getByRole("link", { name })).toBeFocused();
      await expect(chevron(page)).toHaveAttribute("aria-expanded", "true");
    }

    await page.keyboard.press("Escape");
    await expectClosed(page);
    await expect(chevron(page)).toBeFocused();

    // Space opens it too; tabbing past the last link closes it (focus left the item).
    await page.keyboard.press("Space");
    await expectOpen(page);
    for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
    await expect(nav(page).getByRole("link", { name: "Order Inquiry" })).toBeFocused();
    await expectClosed(page);

    // Shift+Tab back onto the chevron does not reopen it.
    await page.keyboard.press("Shift+Tab");
    await expect(chevron(page)).toBeFocused();
    await expectClosed(page);
  });

  test("a click outside closes it", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await chevron(page).click();
    await expectOpen(page);
    await page.mouse.click(20, 600); // the page's side gutter
    await expectClosed(page);
  });

  test("choosing a link goes to the page, closes it and moves focus to the page content", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await chevron(page).click();
    await expectOpen(page);
    await panel(page).getByRole("link", { name: "Beef Cuts" }).click();
    await expect(page).toHaveURL(/\/en\/business\/cuts$/);
    await expectClosed(page);
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("choosing the link for the page you are on also moves focus to the page content", async ({ page }) => {
    await gotoReady(page, "/en/business");
    await chevron(page).click();
    await expectOpen(page);
    await panel(page).getByRole("link", { name: "Overview" }).click();
    await expectClosed(page);
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("a route change without touching it (browser back) closes it", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await topLink(page).click(); // client-side navigation to /en/business
    await expect(page).toHaveURL(/\/en\/business$/);
    await page.mouse.move(20, 600);
    await chevron(page).click();
    await expectOpen(page);
    await page.goBack();
    await expect(page).toHaveURL(/\/en\/about$/);
    await expectClosed(page);
  });

  test("it closes when the header hides on scroll", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await chevron(page).click();
    await expectOpen(page);
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
    await expect(page.locator('header.site-header[data-hidden="true"]')).toHaveCount(1);
    await expectClosed(page);
  });

  test("focus inside the panel moves to the chevron when it closes on its own (hover timer)", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await topLink(page).hover();
    await expectOpen(page);
    await panel(page).getByRole("link", { name: "Beef Cuts" }).focus();
    await page.mouse.move(20, 600); // leaves: the close timer runs out with focus still in the panel
    await expectClosed(page);
    await expect(chevron(page)).toBeFocused();
  });

  test("focus inside the panel moves to the chevron when the header hides", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await chevron(page).click();
    await panel(page).getByRole("link", { name: "Beef Cuts" }).focus();
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" }));
    await expectClosed(page);
    await expect(chevron(page)).toBeFocused();
  });

  test("it closes, with its listeners, when the window gets narrower than 1024px", async ({ page }) => {
    await gotoReady(page, "/en/about");
    await chevron(page).click();
    await expectOpen(page);
    await page.setViewportSize({ width: 900, height: 900 });
    await expect(item(page)).toHaveAttribute("data-state", "closed");
    await page.mouse.move(20, 600); // not resting on the chevron (hovering would open it again)
    await page.setViewportSize({ width: 1440, height: 900 });
    await expectClosed(page); // still closed when it is wide again
  });

  test("each link goes to the right page", async ({ page }) => {
    await gotoReady(page, "/en/about");
    for (const [i, name] of SUB.entries()) {
      await page.mouse.move(20, 600);
      await chevron(page).click();
      await expectOpen(page);
      await panel(page).getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`/en${escapeRegExp(SUB_PATHS[i])}$`));
      await expectClosed(page);
    }
  });

  for (const locale of ["en", "km"]) {
    test(`${locale}: panel links keep the locale`, async ({ page }) => {
      await gotoReady(page, `/${locale}/about`);
      await chevron(page).click();
      await expectOpen(page);
      const hrefs = await panel(page)
        .getByRole("link")
        .evaluateAll((els) => els.map((e) => new URL((e as HTMLAnchorElement).href).pathname));
      expect(hrefs).toEqual(SUB_PATHS.map((p) => `/${locale}${p}`));
    });
  }

  for (const [i, path] of SUB_PATHS.entries()) {
    test(`/en${path}: aria-current marks ${SUB[i]} in the panel; For Business is the current ${i === 0 ? "page" : "section"}`, async ({ page }) => {
      await gotoReady(page, `/en${path}`);
      // Top-level link: "page" only on /business itself, "true" on its sub-pages; same look.
      await expect(topLink(page)).toHaveAttribute("aria-current", i === 0 ? "page" : "true");
      await expect(topLink(page)).toHaveClass(/(^|\s)underline(\s|$)/);
      await chevron(page).click();
      await expectOpen(page);
      const marked = await panel(page)
        .locator("a[aria-current]")
        .evaluateAll((els) => els.map((e) => [(e.textContent ?? "").trim(), e.getAttribute("aria-current")]));
      expect(marked).toEqual([[SUB[i], "page"]]);
    });
  }

  test("opening it moves nothing on the page (overlay, no layout shift, no sideways scroll)", async ({ page }) => {
    await page.goto("/en/business", { waitUntil: "networkidle" });
    await waitForMotionReady(page);
    await expect(chevron(page)).toBeVisible();
    const boxes = () =>
      page.evaluate(() =>
        [
          document.querySelector("header.site-header")!,
          ...Array.from(document.querySelectorAll("header.site-header nav > ul > li")),
          document.getElementById("main-content")!,
          document.querySelector("#main-content h1")!,
        ].map((el) => el.getBoundingClientRect().toJSON()),
      );
    const before = await boxes();
    await page.evaluate(() => {
      const w = window as unknown as { __shift: number };
      w.__shift = 0;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries() as unknown as { value: number }[]) w.__shift += e.value;
      }).observe({ type: "layout-shift" });
    });
    await topLink(page).hover();
    await expectOpen(page);
    await expectSettledOpen(page);
    expect(await boxes()).toEqual(before);
    expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
    // It sits above the page content.
    const box = (await panel(page).getByRole("link", { name: "Beef Knowledge" }).boundingBox())!;
    const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest("#forBusiness-menu"), [
      box.x + box.width / 2,
      box.y + box.height / 2,
    ]);
    expect(hit).toBe(true);
  });

  test("hovering the chevron shows a soft fill and no outline; the keyboard ring shows only for keyboard focus", async ({ page }) => {
    await gotoReady(page, "/en/about");
    const style = () =>
      iconWrapper(page).evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          outline: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0,
          shadow: cs.boxShadow !== "none",
          background: cs.backgroundColor,
        };
      });
    const resting = await style();
    expect(resting).toMatchObject({ outline: false, shadow: false, background: "rgba(0, 0, 0, 0)" });

    // Mouse: hover shows the fill; a click (focus by mouse) leaves no ring on the icon wrapper.
    await chevron(page).hover();
    await expect.poll(async () => (await style()).background).not.toBe("rgba(0, 0, 0, 0)");
    expect(await style()).toMatchObject({ outline: false, shadow: false });
    await chevron(page).click();
    await expect(chevron(page)).toBeFocused();
    expect(await style()).toMatchObject({ outline: false, shadow: false });
    // Also no outline on the 44px button itself (the old circle).
    expect(await chevron(page).evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("none");

    // Keyboard: Tab onto the chevron shows a visible ring on the icon wrapper.
    await page.reload();
    await waitForMotionReady(page);
    await expect(chevron(page)).toBeVisible();
    await page.mouse.move(20, 600);
    await page.keyboard.press("Tab"); // skip link
    await page.keyboard.press("Tab"); // logo
    await page.keyboard.press("Tab"); // About
    await page.keyboard.press("Tab"); // For Business
    await page.keyboard.press("Tab"); // chevron
    await expect(chevron(page)).toBeFocused();
    const ring = await style();
    expect(ring.outline || ring.shadow).toBe(true);
    expect(await chevron(page).evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("none");
  });

  test("without JavaScript: the chevron is hidden, the panel stays hidden and For Business is still a working link", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto("/en/about");
    await expect(page.locator('header.site-header button[aria-controls="forBusiness-menu"]')).toBeHidden();
    await expect(panel(page)).toBeHidden();
    await expect(topLink(page)).toBeVisible();
    await expect(topLink(page)).toHaveAttribute("href", "/en/business");
    await context.close();
  });
});

test.describe("desktop header layout", () => {
  for (const locale of ["en", "km"]) {
    test(`1024px /${locale}: no sideways scroll, logo, nav and language switch do not overlap`, async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await gotoReady(page, `/${locale}/about`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
      const header = page.locator("header.site-header");
      const logo = (await header.locator('a[href$="/' + locale + '"], a[href="/"]').first().boundingBox())!;
      const navBox = (await nav(page).boundingBox())!;
      const lang = (await header.locator('div[role="group"]').first().boundingBox())!;
      expect(logo.x + logo.width).toBeLessThanOrEqual(navBox.x);
      expect(navBox.x + navBox.width).toBeLessThanOrEqual(lang.x);
      expect(lang.x + lang.width).toBeLessThanOrEqual(1024);
    });
  }

  // Every desktop width people commonly use, on pages where different items are underlined, in
  // both languages. The gaps are measured between what is actually drawn: each label's text (a
  // Range around its glyphs, not the link box) and the chevron's stroke (its path, not the icon's
  // box). They must equal the designed 32px, not just each other: if the list's gap rule were ever
  // missing, both gaps would be ~0 and "equal".
  for (const path of ["/en/about", "/en/business", "/km/about"]) {
    for (const width of [1024, 1100, 1180, 1280, 1366, 1440, 1536, 1920]) {
      test(`${width}px ${path}: equal 32px visible gaps between the items; 44px chevron tap area overlaps nothing`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await gotoReady(page, path);
        await page.evaluate(() => document.fonts.ready);
        const m = await page.evaluate(() => {
          const nav = document.querySelector("header.site-header nav")!;
          const links = Array.from(nav.querySelectorAll(":scope > ul > li > a"));
          const [about, business, order] = links.map((a) => {
            const range = document.createRange();
            range.selectNodeContents(a);
            return range.getBoundingClientRect();
          });
          const svg = nav.querySelector("[data-chevron-icon] svg")!;
          const chevPath = svg.querySelector("path")!;
          // The path's box is its centre line; the stroke reaches half its width further out.
          const halfStroke = (parseFloat(getComputedStyle(chevPath).strokeWidth) * (svg.getBoundingClientRect().width / 24)) / 2;
          const p = chevPath.getBoundingClientRect();
          const glyph = { left: p.left - halfStroke, right: p.right + halfStroke };

          const button = nav.querySelector("button")!;
          const b = button.getBoundingClientRect();
          const tap = getComputedStyle(button, "::before");
          const tapW = parseFloat(tap.width);
          const tapH = parseFloat(tap.height);
          const midY = b.top + b.height / 2;
          const hits = (x: number) => document.elementFromPoint(x, midY)?.closest("button") === button;
          const businessLink = links[1].getBoundingClientRect();
          const orderLink = links[2].getBoundingClientRect();
          return {
            labels: links.map((a) => a.textContent),
            gapAboutBusiness: business.left - about.right,
            gapLabelChevron: glyph.left - business.right,
            gapChevronOrder: order.left - glyph.right,
            tapW,
            tapH,
            tapLeftHits: hits(b.left + 1),
            tapRightHits: hits(b.left + tapW - 1),
            tapStartAfterLabel: b.left - businessLink.right,
            tapEndBeforeOrder: orderLink.left - (b.left + tapW),
            orderStillHitsOrder: document.elementFromPoint(orderLink.left + 1, midY)?.closest("a") === links[2],
          };
        });
        expect(m.labels).toHaveLength(3);
        // Visible gaps: both 32px (±1.5) and within 1px of each other.
        expect(m.gapAboutBusiness, "About → For Business").toBeGreaterThanOrEqual(30.5);
        expect(m.gapAboutBusiness, "About → For Business").toBeLessThanOrEqual(33.5);
        expect(m.gapChevronOrder, "chevron → Order Inquiry").toBeGreaterThanOrEqual(30.5);
        expect(m.gapChevronOrder, "chevron → Order Inquiry").toBeLessThanOrEqual(33.5);
        expect(Math.abs(m.gapAboutBusiness - m.gapChevronOrder)).toBeLessThanOrEqual(1);
        // The chevron reads as part of For Business.
        expect(m.gapLabelChevron).toBeGreaterThanOrEqual(6);
        expect(m.gapLabelChevron).toBeLessThanOrEqual(8);
        // 44×44 tap area, all of it clickable, covering neither the label nor Order Inquiry.
        expect(m.tapW).toBeGreaterThanOrEqual(44);
        expect(m.tapH).toBeGreaterThanOrEqual(44);
        expect(m.tapLeftHits).toBe(true);
        expect(m.tapRightHits).toBe(true);
        expect(m.tapStartAfterLabel).toBeGreaterThanOrEqual(-0.5);
        expect(m.tapEndBeforeOrder).toBeGreaterThanOrEqual(1);
        expect(m.orderStillHitsOrder).toBe(true);
      });
    }
  }
});

test.describe("desktop dropdown, reduced motion", () => {
  test.use({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });

  test("opens with no movement and no fade", async ({ page }) => {
    await gotoReady(page, "/en/about");
    // Once the motion preference is known (right after hydration), the closed panel has no offset.
    await expect.poll(() => panel(page).evaluate((el) => getComputedStyle(el).transform)).toBe("none");
    await chevron(page).click();
    // The moment it is visible it must already be at its end state (a fade or slide would show
    // visible with opacity below 1 or a transform).
    await expect.poll(() => panel(page).evaluate((el) => getComputedStyle(el).visibility)).toBe("visible");
    const style = await panel(page).evaluate((el) => {
      const cs = getComputedStyle(el);
      return [cs.opacity, cs.transform];
    });
    expect(style).toEqual(["1", "none"]);
  });
});

test.describe("touch screen at 1024px", () => {
  test.use({ hasTouch: true, viewport: { width: 1024, height: 768 } });

  test("tapping the chevron opens and closes it, anywhere in its 44px area; it fits the header and the screen", async ({ page }) => {
    await gotoReady(page, "/en/about");
    // The tap area is an invisible ::before, 44px wide from the end of the label (the button's own
    // box is only as wide as the drawn chevron). Tap near its far right end.
    const chev = (await chevron(page).boundingBox())!;
    const tap = await chevron(page).evaluate((el) => {
      const cs = getComputedStyle(el, "::before");
      return { w: parseFloat(cs.width), h: parseFloat(cs.height) };
    });
    expect(tap.w).toBeGreaterThanOrEqual(44);
    expect(tap.h).toBeGreaterThanOrEqual(44);
    const order = (await nav(page).getByRole("link", { name: "Order Inquiry" }).boundingBox())!;
    expect(chev.x + tap.w).toBeLessThanOrEqual(order.x);

    await page.touchscreen.tap(chev.x + tap.w - 3, chev.y + chev.height / 2);
    await expectOpen(page);
    await expect(item(page)).toHaveAttribute("data-mode", "pinned");
    const p = (await panel(page).locator("ul").boundingBox())!;
    expect(p.x + p.width).toBeLessThanOrEqual(1024);

    await chevron(page).tap();
    await expectClosed(page);
  });
});

test.describe("mobile menu", () => {
  test("lists the three sub-pages, indented under For Business, current one marked", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/business/cuts");
    await waitForMotionReady(page);
    await expect(chevron(page)).toBeHidden(); // the desktop dropdown is not shown on phones
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    // The links' rise-in stagger has finished once the last item is at rest.
    const lastItem = dialog.locator("nav > ul > li").last();
    await expect(lastItem).toHaveCSS("opacity", "1");
    await expect(lastItem).toHaveCSS("transform", "none");
    const parent = dialog.getByRole("link", { name: "For Business", exact: true });
    await expect(parent).toHaveAttribute("aria-current", "true");
    const parentBox = (await parent.boundingBox())!;

    let prevY = parentBox.y;
    for (const [i, name] of SUB.entries()) {
      const link = dialog.getByRole("link", { name });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", `/en${SUB_PATHS[i]}`);
      if (name === "Beef Cuts") await expect(link).toHaveAttribute("aria-current", "page");
      else await expect(link).not.toHaveAttribute("aria-current", /.*/);
      const box = (await link.boundingBox())!;
      expect(box.x).toBeGreaterThan(parentBox.x + 8); // indented
      expect(box.y).toBeGreaterThan(prevY); // below For Business, in order
      expect(box.height).toBeGreaterThanOrEqual(44);
      prevY = box.y;
    }
    // Order Inquiry comes after them, back at the top level.
    const inquiry = (await dialog.getByRole("link", { name: "Order Inquiry" }).boundingBox())!;
    expect(inquiry.y).toBeGreaterThan(prevY);
    expect(Math.round(inquiry.x)).toBe(Math.round(parentBox.x));

    await dialog.getByRole("link", { name: "Beef Knowledge" }).click();
    await expect(page).toHaveURL(/\/en\/business\/knowledge$/);
    await expect(dialog).toHaveCount(0);
  });
});
