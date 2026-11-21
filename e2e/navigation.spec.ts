import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { escapeRegExp } from "./helpers";

// Site structure after the navigation restructure: the menu (About · For Business · Order
// Inquiry, no Home), the logo as the way home, active states, the For Business sub-navigation,
// the temporary redirects from the old URLs, About's #farm-to-table section, and the quote-link
// allow-list on the Order Inquiry page.

const MENU = ["About", "For Business", "Order Inquiry"];

// Khmer accessible names come from the message file, so the tests follow the team's wording.
const KM = JSON.parse(readFileSync("messages/km.json", "utf8"));

const mainNav = (page: Page, name = "Main") => page.locator("header.site-header").getByRole("navigation", { name });
const linkNames = (scope: ReturnType<Page["locator"]>) =>
  scope.getByRole("link").evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));

test.describe("menu", () => {
  test("desktop: About · For Business · Order Inquiry, no Home", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/about");
    expect(await linkNames(mainNav(page))).toEqual(MENU);
    await expect(mainNav(page).getByRole("link", { name: "Home" })).toHaveCount(0);
    // The separate "Contact us" button is gone: Order Inquiry covers it.
    await expect(page.locator("header.site-header").getByRole("link", { name: "Contact us" })).toHaveCount(0);
    expect(await mainNav(page).getByRole("link").evaluateAll((els) => els.map((e) => new URL((e as HTMLAnchorElement).href).pathname))).toEqual([
      "/en/about",
      "/en/business",
      "/en/contact",
    ]);
  });

  test("mobile menu: the same three items (For Business with its three sub-pages), no Home", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    expect(await linkNames(dialog.getByRole("navigation"))).toEqual([
      "About",
      "For Business",
      "Overview",
      "Beef Cuts",
      "Beef Knowledge",
      "Order Inquiry",
    ]);
    await expect(dialog.getByRole("link", { name: "Home" })).toHaveCount(0);
  });

  test("footer page list matches the menu", async ({ page }) => {
    await page.goto("/en/contact");
    const footerNav = page.locator("#site-footer").getByRole("navigation", { name: "Explore" });
    expect(await linkNames(footerNav)).toEqual(MENU);
  });

  test("Khmer pages: same three links, locale kept", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/km/about");
    expect(await mainNav(page, KM.nav.label).getByRole("link").evaluateAll((els) => els.map((e) => new URL((e as HTMLAnchorElement).href).pathname))).toEqual([
      "/km/about",
      "/km/business",
      "/km/contact",
    ]);
  });
});

test.describe("logo", () => {
  for (const locale of ["en", "km"]) {
    test(`${locale}: links home, named "BattamBeef home", reachable with Tab and a visible focus ring`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${locale}/business`);
      const name = locale === "km" ? KM.header.logo : "BattamBeef home";
      const logo = page.locator("header.site-header").getByRole("link", { name, exact: true });
      await expect(logo).toHaveAttribute("href", `/${locale}`);
      if (locale === "km") expect(await logo.getAttribute("lang")).toBeNull(); // translated, so not marked English
      await page.keyboard.press("Tab"); // skip link
      await page.keyboard.press("Tab");
      await expect(logo).toBeFocused();
      const ring = await logo.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
      });
      expect(ring.style).not.toBe("none");
      expect(ring.width).toBeGreaterThan(0);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`/${escapeRegExp(locale)}$`));
    });
  }
});

test.describe("active states", () => {
  // aria-current="page" only on the link to the exact page; "true" on the section's top-level
  // link when the page is one of its sub-pages. Both look the same (underlined).
  const CASES = [
    { path: "/en/about", active: "About", value: "page" },
    { path: "/en/business", active: "For Business", value: "page" },
    { path: "/en/business/cuts", active: "For Business", value: "true" },
    { path: "/en/business/knowledge", active: "For Business", value: "true" },
    { path: "/en/contact", active: "Order Inquiry", value: "page" },
    { path: "/en", active: null, value: null },
  ];

  for (const { path, active, value } of CASES) {
    test(`${path}: ${active ? `${active} is current (aria-current="${value}")` : "nothing is current"}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      // Top-level menu links only (the closed For Business panel has its own links).
      const current = await mainNav(page)
        .locator(":scope > ul > li > a[aria-current]")
        .evaluateAll((els) => els.map((e) => [(e.textContent ?? "").trim(), e.getAttribute("aria-current"), e.classList.contains("underline")]));
      expect(current).toEqual(active ? [[active, value, true]] : []);
    });
  }

  test("mobile menu: For Business is the current section on a sub-page, the sub-page is the current page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/business/knowledge");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("link", { name: "For Business" })).toHaveAttribute("aria-current", "true");
    await expect(dialog.getByRole("link", { name: "Beef Knowledge" })).toHaveAttribute("aria-current", "page");
    expect(await dialog.locator('a[aria-current="page"]').count()).toBe(1);
  });
});

test.describe("For Business sub-navigation", () => {
  const PAGES = [
    { path: "/en/business", current: "Overview" },
    { path: "/en/business/cuts", current: "Beef Cuts" },
    { path: "/en/business/knowledge", current: "Beef Knowledge" },
  ];

  for (const { path, current } of PAGES) {
    for (const width of [360, 390, 1440]) {
      test(`${width}px ${path}: Overview · Beef Cuts · Beef Knowledge, ${current} current, one row, fits the screen`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const sub = page.getByRole("navigation", { name: "For Business sections" });
        await expect(sub).toBeVisible();
        expect(await linkNames(sub)).toEqual(["Overview", "Beef Cuts", "Beef Knowledge"]);
        const marked = await sub.locator('a[aria-current="page"]').evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()));
        expect(marked).toEqual([current]);
        // Above the page title, every link a full tap target, nothing off screen.
        const navBox = (await sub.boundingBox())!;
        const h1Box = (await page.locator("h1").boundingBox())!;
        expect(navBox.y).toBeLessThan(h1Box.y);
        const boxes = await sub.getByRole("link").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
        for (const box of boxes) {
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.left).toBeGreaterThanOrEqual(0);
          expect(box.right).toBeLessThanOrEqual(width);
        }
        // One row: every pill on the same line.
        expect(new Set(boxes.map((b) => Math.round(b.top))).size).toBe(1);
        // The page itself never scrolls sideways.
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      });
    }
  }

  test("360px Khmer: still one row inside the screen", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/km/business/cuts");
    // Real Khmer labels (from messages/km.json), not the English fallback.
    const sub = page.getByRole("navigation", { name: KM.businessNav.label });
    expect(await linkNames(sub)).toEqual([KM.businessNav.overview, KM.businessNav.cuts, KM.businessNav.knowledge]);
    const boxes = await sub
      .getByRole("link")
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    expect(boxes.length).toBe(3);
    expect(new Set(boxes.map((b) => Math.round(b.top))).size).toBe(1);
    for (const box of boxes) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.right).toBeLessThanOrEqual(360);
    }
  });

  test("links move between the three pages", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/business");
    const sub = page.getByRole("navigation", { name: "For Business sections" });
    await sub.getByRole("link", { name: "Beef Cuts" }).click();
    await expect(page).toHaveURL(/\/en\/business\/cuts$/);
    await expect(sub.getByRole("link", { name: "Beef Cuts" })).toHaveAttribute("aria-current", "page");
    await sub.getByRole("link", { name: "Beef Knowledge" }).click();
    await expect(page).toHaveURL(/\/en\/business\/knowledge$/);
    await sub.getByRole("link", { name: "Overview" }).click();
    await expect(page).toHaveURL(/\/en\/business$/);
  });
});

test.describe("redirects from old URLs", () => {
  const MOVED = [
    ["/farm-to-table", "/about#farm-to-table"],
    ["/beef-cuts", "/business/cuts"],
    ["/beef-knowledge", "/business/knowledge"],
    ["/for-business", "/business"],
  ] as const;

  for (const locale of ["en", "km"]) {
    for (const [from, to] of MOVED) {
      test(`/${locale}${from} → /${locale}${to} (307, fixed target, query dropped)`, async ({ request, baseURL }) => {
        for (const query of ["", "?part=loin&next=https://example.com/%3Cscript%3E"]) {
          const res = await request.get(`/${locale}${from}${query}`, { maxRedirects: 0 });
          expect(res.status(), query).toBe(307);
          const target = new URL(res.headers()["location"], baseURL);
          expect(target.origin).toBe(new URL(baseURL!).origin);
          expect(target.pathname + target.search + target.hash, query).toBe(`/${locale}${to}`);
        }
        // Followed: the new page answers.
        expect((await request.get(`/${locale}${from}`)).status()).toBe(200);
      });
    }
  }

  test("in the browser: an old cut-map link keeps its part; an unprefixed old URL gets its locale first", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts#loin");
    await expect(page).toHaveURL(/\/en\/business\/cuts#loin$/);
    await page.goto("/beef-knowledge");
    await expect(page).toHaveURL(/\/en\/business\/knowledge$/);
    await page.goto("/km/farm-to-table");
    await expect(page).toHaveURL(/\/km\/about#farm-to-table$/);
    await expect(page.locator("#farm-to-table-heading")).toBeInViewport();
  });

  test("the old page paths no longer exist on their own", async ({ request }) => {
    // Only the exact old paths redirect; anything below them is an ordinary 404.
    expect((await request.get("/en/beef-cuts/extra", { maxRedirects: 0 })).status()).toBe(404);
  });
});

test.describe("About: the Farm to Table section", () => {
  /** Total layout shift from page load (buffered), ignoring shifts right after user input. */
  const CLS_SCRIPT = () => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) w.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  };
  const cls = (page: Page) => page.evaluate(() => (window as unknown as { __cls: number }).__cls);

  test("is on /about with its heading, journey, 72 hours and aims; one h1 on the page", async ({ page }) => {
    await page.goto("/en/about");
    const section = page.locator("#farm-to-table");
    await expect(section).toHaveCount(1);
    await expect(section.locator("#farm-to-table-heading")).toContainText("From Battambang to your table.");
    await expect(section.locator("#journey")).toHaveCount(1);
    await expect(section.locator("#chill")).toHaveCount(1);
    await expect(section.locator("#result-heading")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    // Aims buttons point to the new routes.
    await expect(section.getByRole("link", { name: "Explore our cuts" })).toHaveAttribute("href", "/en/business/cuts");
  });

  for (const width of [390, 1440]) {
    test(`${width}px: /about#farm-to-table lands on the section below the header; no layout shift`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(CLS_SCRIPT);
      await page.goto("/en/about#farm-to-table", { waitUntil: "networkidle" });
      const top = await page.locator("#farm-to-table").evaluate((el) => el.getBoundingClientRect().top);
      const header = await page.locator("header.site-header").evaluate((el) => el.getBoundingClientRect().height);
      expect(top).toBeGreaterThanOrEqual(header - 1);
      expect(top).toBeLessThan(header + 40);

      if (width >= 1024) {
        // The desktop journey starts and holds its stage, also after everything above has loaded
        // (the debounced refresh re-measured the trigger).
        await expect(page.locator('[data-journey="desktop"][data-pinned]')).toBeAttached();
        await page.waitForTimeout(400);
        const { trackTop, range } = await page.locator('[data-journey="desktop"]').evaluate((el: HTMLElement) => ({
          trackTop: el.getBoundingClientRect().top + scrollY,
          range: el.offsetHeight - innerHeight,
        }));
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), trackTop + range * 0.5);
        await page.waitForTimeout(900);
        const stage = await page.locator('[data-journey="desktop"] > div').boundingBox();
        expect(Math.abs(stage!.y)).toBeLessThanOrEqual(1);
        await expect(page.locator('[data-rail-step][aria-current="step"]')).toHaveAttribute("data-rail-step", "2");
      } else {
        await expect(page.locator('[data-journey="stacked"]')).toBeVisible();
      }
      expect(await cls(page)).toBe(0);
    });
  }

  test("Home links to the section (statement and journey preview)", async ({ page }) => {
    await page.goto("/en");
    const hrefs = await page
      .locator("#main-content a")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? "").filter((h) => h.includes("farm-to-table")));
    expect(hrefs).toEqual(["/en/about#farm-to-table", "/en/about#farm-to-table"]);
  });
});

test.describe("Order Inquiry: quote-link allow-list", () => {
  const preset = (page: Page) => page.getByText("We have filled in the cut from your quote request.");

  test("a quote from Beef Cuts still preselects; unknown values are still rejected", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/contact?part=loin&cut=striploin");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Let's talk about your order.");
    await expect(preset(page)).toBeVisible();
    await expect(page.locator("#contact-form-enquiryType")).toHaveValue("order");
    await expect(page.locator("#contact-form-interest")).toHaveValue("cut:striploin");

    for (const query of [
      "part=business&cut=cuts", // route names are not IDs
      "part=%2Fen%2Fbusiness%2Fcuts",
      "cut=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E",
      "part=loin&cut=brisket", // a cut from another part: the cut is dropped, the part stays
    ]) {
      await page.goto(`/en/contact?${query}`);
      await page.waitForTimeout(300);
      if (query.startsWith("part=loin")) {
        await expect(page.locator("#contact-form-interest"), query).toHaveValue("part:loin");
      } else {
        await expect(preset(page), query).toHaveCount(0);
        await expect(page.locator("#contact-form-enquiryType"), query).toHaveValue("");
        await expect(page.locator("#contact-form-interest"), query).toHaveValue("");
      }
      expect(await page.content(), query).not.toContain("onerror=alert");
    }
  });
});
