import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];
const PAGES = ["", "/about", "/farm-to-table", "/beef-cuts", "/for-business", "/beef-knowledge", "/contact"];

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

test.describe("layout", () => {
  for (const width of WIDTHS) {
    test(`no sideways scroll at ${width}px (en + km)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const locale of ["en", "km"]) {
        for (const path of PAGES) {
          await page.goto(`/${locale}${path}`);
          await page.waitForTimeout(150);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          expect(overflow, `/${locale}${path}`).toBeLessThanOrEqual(0);
        }
      }
    });
  }

  test("bottom bar only below 768px, desktop nav from 1024px", async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/en/about");
      await expect(page.locator("#bottom-bar")).toBeVisible({ visible: width < 768 });
      await expect(page.getByRole("navigation", { name: "Main" }).first()).toBeVisible({ visible: width >= 1024 });
      await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible({ visible: width < 1024 });
    }
  });

  test("header controls and bottom bar labels fit on screen", async ({ page }) => {
    for (const width of WIDTHS) {
      for (const locale of ["en", "km"]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(`/${locale}/about`);
        const offenders = await page.evaluate((vw) => {
          const els = [...document.querySelectorAll<HTMLElement>("header.site-header a, header.site-header button, #bottom-bar a")];
          return els
            .filter((el) => el.offsetParent !== null)
            .filter((el) => {
              const r = el.getBoundingClientRect();
              return r.left < 0 || r.right > vw || el.scrollWidth > el.clientWidth + 1;
            })
            .map((el) => el.textContent?.trim() || el.getAttribute("aria-label"));
        }, width);
        expect(offenders, `${locale} @ ${width}px`).toEqual([]);
      }
    }
  });

  test("bottom bar: translucent charcoal, Contact us while no Telegram handle exists", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/about");
    const bar = page.locator("#bottom-bar");
    const bg = await bar.evaluate((el) => getComputedStyle(el).backgroundColor);
    // color-mix(... 94%, transparent) → an alpha below 1, not the solid surface colour.
    const alpha = Number(bg.match(/[\d.]+(?=\)$)/)?.[0] ?? 1);
    expect(bg).not.toBe("rgb(41, 43, 45)");
    expect(alpha).toBeLessThan(1);
    expect(alpha).toBeGreaterThan(0.85);
    const contact = bar.getByRole("link", { name: "Contact us" });
    await expect(contact).toHaveAttribute("href", "/en/contact");
    await expect(bar.getByRole("link", { name: "Contact on Telegram" })).toHaveCount(0);
  });

  test("bottom bar never covers the end of the page (every page, 360 and 390px)", async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await page.goto(`/en${path}`);
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(400);
        const rights = page.locator("#site-footer p").last();
        const bar = await page.locator("#bottom-bar").boundingBox();
        const text = await rights.boundingBox();
        expect(text!.y + text!.height, `${width}px ${path}`).toBeLessThanOrEqual(bar!.y);
      }
    }
  });

  test("a form field reached with Tab is never hidden behind the bottom bar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto("/en/contact");
    await page.locator("#contact-form-name").focus();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const box = await page.evaluate(() => document.activeElement!.getBoundingClientRect().bottom);
      const bar = (await page.locator("#bottom-bar").boundingBox())!;
      expect(box, `Tab ${i + 1}`).toBeLessThanOrEqual(bar.y);
    }
  });
});

test.describe("header", () => {
  test("keyboard: skip link first, then header controls in order", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/about");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeInViewport();
    const names: string[] = [];
    for (let i = 0; i < 11; i++) {
      await page.keyboard.press("Tab");
      names.push(await page.evaluate(() => (document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || "").trim()));
    }
    expect(names).toEqual([
      "BattamBeef",
      "Home",
      "About",
      "Farm to Table",
      "Beef Cuts",
      "For Business",
      "Beef Knowledge",
      "Contact",
      "English",
      "ភាសាខ្មែរ",
      "Contact us",
    ]);
  });
});

test.describe("mobile menu", () => {
  test("opens, traps focus, locks scroll, hides bottom bar, closes with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/about");
    const button = page.getByRole("button", { name: "Open menu" });
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    // Not aria-modal: the close button lives in the header, outside the panel.
    await expect(dialog).not.toHaveAttribute("aria-modal", /.*/);
    await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Home" })).toBeFocused();
    await expect(page.locator("#bottom-bar")).toHaveCount(0);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
    expect(await page.evaluate(() => document.getElementById("main-content")!.inert)).toBe(true);
    // The skip link would jump into the inert page behind the menu: it is inert too.
    expect(await page.evaluate(() => document.getElementById("skip-link")!.inert)).toBe(true);

    // Tab many times: focus never leaves the header + menu.
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => {
        const a = document.activeElement;
        return !!a && (!!a.closest("#site-menu") || !!a.closest("header.site-header"));
      });
      expect(inside).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    await expect(page.locator("#bottom-bar")).toBeVisible();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe("hidden");
    expect(await page.evaluate(() => document.getElementById("skip-link")!.inert)).toBe(false);
  });

  test("menu link navigates and closes", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/en/about");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Beef Cuts" }).click();
    await expect(page).toHaveURL(/\/en\/beef-cuts$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Focus moves to the new page's content, not left on <body>.
    await expect(page.locator("#main-content")).toBeFocused();
  });
});

test.describe("language", () => {
  test("Khmer pages never show TODO-KM; English fallback is marked lang=en", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const path of [...PAGES, "/no-such-page"]) {
      await page.goto(`/km${path}`);
      const found = await page.evaluate(() => {
        const hits: string[] = [];
        if (document.title.includes("TODO-KM")) hits.push(`title: ${document.title}`);
        if (document.body.innerText.includes("TODO-KM")) hits.push("visible text");
        for (const el of document.querySelectorAll("*")) {
          for (const attr of ["aria-label", "title", "alt", "placeholder", "content"]) {
            if (el.getAttribute(attr)?.includes("TODO-KM")) hits.push(`${el.tagName.toLowerCase()}[${attr}]`);
          }
        }
        // Hidden label sources (aria-labelledby targets) count too.
        for (const el of document.querySelectorAll("[hidden], .sr-only")) {
          if (el.textContent?.includes("TODO-KM")) hits.push(`hidden text in ${el.tagName.toLowerCase()}`);
        }
        return hits;
      });
      expect(found, `/km${path}`).toEqual([]);
    }
    await page.goto("/km/about");
    await expect(page.getByRole("navigation", { name: "Main" }).first().getByRole("link", { name: "About" })).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
    // The language switch stays visible and keeps its own languages.
    await expect(page.getByRole("link", { name: "English" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "ភាសាខ្មែរ" }).first()).toHaveAttribute("lang", "km");
  });

  test("site loads and the language switch works when sessionStorage throws", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      Object.defineProperty(window, "sessionStorage", {
        configurable: true,
        get() {
          throw new DOMException("Storage is disabled", "SecurityError");
        },
      });
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/en/about");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Rooted in Battambang");
    await page.getByRole("link", { name: "ភាសាខ្មែរ" }).first().click();
    await expect(page).toHaveURL(/\/km\/about$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("link", { name: "English" }).first().click();
    await expect(page).toHaveURL(/\/en\/about$/);
    expect(errors).toEqual([]);
    await context.close();
  });

  test("language switch works on every page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const path of PAGES) {
      await page.goto(`/en${path}`);
      await page.getByRole("link", { name: "ភាសាខ្មែរ" }).first().click();
      await expect(page).toHaveURL(new RegExp(`/km${path}$`));
      await page.getByRole("link", { name: "English" }).first().click();
      await expect(page).toHaveURL(new RegExp(`/en${path}$`));
    }
  });
});

test.describe("interaction kit", () => {
  test("page transition: new page rises in on navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/about");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/en\/contact$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Let's talk beef.");
  });
});

test.describe("without JavaScript", () => {
  test("main heading and reveals are visible with JavaScript disabled", async ({ browser, request }) => {
    // The server HTML never ships content hidden with inline opacity:0.
    for (const path of ["/en", "/km", "/en/about"]) {
      const html = await (await request.get(path)).text();
      const h1 = html.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? "";
      expect(h1, path).not.toBe("");
      expect(h1, path).not.toMatch(/opacity:\s*0/);
    }

    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    for (const path of ["/en", "/km"]) {
      await page.goto(path);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toContainText("Holy Cow");
      // The letters finish their CSS rise and end fully visible.
      await expect
        .poll(() => h1.locator("[data-piece]").evaluateAll((els) => els.length > 0 && els.every((el) => getComputedStyle(el).opacity === "1")))
        .toBe(true);
    }

    await context.close();
  });

});

test.describe("without JavaScript: every section fully visible", () => {
  // Server HTML is always visible; elements are hidden only once the head script has added
  // html.js-motion (globals.css, "Reveal kit"). With JavaScript off, nothing may stay hidden,
  // on any real page, above or below the fold.
  const ALL_PAGES = ["", "/about", "/farm-to-table", "/beef-cuts", "/for-business", "/beef-knowledge", "/contact"];

  for (const locale of ["en", "km"]) {
    test(`${locale}: no reveal stays hidden on any page (390px)`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      for (const path of ALL_PAGES) {
        await page.goto(`/${locale}${path}`);
        // Let the CSS-only heading animations finish.
        await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => null))));
        const state = await page.evaluate(() => ({
          jsMotion: document.documentElement.classList.contains("js-motion"),
          hidden: [...document.querySelectorAll("[data-reveal], [data-reveal-item], [data-piece]")]
            .filter((el) => {
              const cs = getComputedStyle(el);
              return cs.opacity !== "1" || cs.clipPath.startsWith("inset(100%") || cs.transform.startsWith("matrix(0,") || cs.visibility === "hidden";
            })
            .map((el) => `${el.tagName}[${el.getAttribute("data-reveal") ?? ""}] ${el.textContent?.slice(0, 30)}`),
          emptySections: [...document.querySelectorAll("main section, #main-content section")].filter((el) => el.getBoundingClientRect().height < 40).length,
        }));
        expect(state.jsMotion, `${locale}${path}`).toBe(false);
        expect(state.hidden, `${locale}${path}`).toEqual([]);
        expect(state.emptySections, `${locale}${path}`).toBe(0);
      }
      await context.close();
    });
  }

  test("Home, Beef Cuts and Farm to Table: sections have content and are not hidden", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    for (const path of ["/en", "/en/beef-cuts", "/en/farm-to-table"]) {
      await page.goto(path);
      await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime)).map((a) => a.finished.catch(() => null))));
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll("#main-content section")]
          .filter((el) => {
            const cs = getComputedStyle(el);
            const txt = (el.textContent ?? "").trim().length;
            return cs.display === "none" || cs.visibility === "hidden" || cs.opacity !== "1" || txt === 0 || el.getBoundingClientRect().height < 40;
          })
          .map((el) => el.getAttribute("aria-labelledby") ?? el.id ?? el.className),
      );
      expect(bad, path).toEqual([]);
      // Headings and body text inside sections are visible too (not zero-opacity, not clipped away).
      const invisibleText = await page.evaluate(() =>
        [...document.querySelectorAll("#main-content :is(h1, h2, h3, p, li)")]
          .filter((el) => {
            if (el.closest("[hidden], [aria-hidden='true'], .sr-only")) return false;
            const cs = getComputedStyle(el);
            return (el.textContent ?? "").trim() !== "" && (cs.opacity === "0" || cs.visibility === "hidden");
          })
          .map((el) => el.textContent?.slice(0, 30)),
      );
      expect(invisibleText, path).toEqual([]);
    }
    await context.close();
  });
});

test.describe("privacy and security", () => {
  test("the styleguide is development only: 404 on this production build", async ({ request }) => {
    for (const path of ["/en/styleguide", "/km/styleguide"]) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });

  test("no requests to external domains, no console errors (CSP)", async ({ page }) => {
    const external: string[] = [];
    const errors: string[] = [];
    page.on("request", (r) => {
      const url = new URL(r.url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname) && url.protocol.startsWith("http")) external.push(r.url());
    });
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const path of PAGES) {
      await page.goto(`/en${path}`);
      await page.goto(`/km${path}`);
    }
    await page.goto("/en/beef-cuts");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(800);
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("security headers present", async ({ request }) => {
    const res = await request.get("/en");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).not.toContain("unsafe-eval");
    expect(h["x-robots-tag"]).toBe("noindex, nofollow");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["permissions-policy"]).toContain("camera=()");
    expect(h["set-cookie"]).toBeUndefined();
  });
});

test.describe("logo and icons", () => {
  /** Which header logo is showing: "dark" (charcoal wordmark) or "light" (white wordmark). */
  const shownLogo = (page: Page) =>
    page.evaluate(() => {
      const fill = getComputedStyle(document.querySelector("header.site-header svg.brand-logo path:last-child")!).fill;
      return fill === "rgb(41, 43, 45)" ? "dark" : fill === "rgb(245, 243, 239)" ? "light" : fill;
    });

  for (const width of [360, 1440]) {
    test(`${width}px: header logo follows the surface; named "BattamBeef", links home`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/en/about");
      const link = page.locator("header.site-header").getByRole("link", { name: "BattamBeef", exact: true });
      await expect(link).toHaveAttribute("href", "/en");
      const box = (await link.locator("svg").first().boundingBox())!;
      expect(box.height).toBe(width >= 1024 ? 44 : 36);
      expect(box.width / box.height).toBeCloseTo(2224 / 952, 1);
      // Tap target and clear space inside the header bar.
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      // About opens on a dark section: white wordmark.
      await expect.poll(() => shownLogo(page)).toBe("light");
      // Over a light section: charcoal wordmark.
      await scrollToSelector(page, "[data-surface=light]", 10);
      await expect.poll(() => headerTheme(page)).toBe("light");
      await expect.poll(() => shownLogo(page)).toBe("dark");

      // Home: over the pale hero sky (charcoal text) the charcoal wordmark; once scrolled onto
      // the charcoal header background, the white one.
      await page.goto("/en");
      await expect.poll(() => shownLogo(page)).toBe("dark");
      await scrollToSelector(page, "#statement-heading", 300);
      await expect.poll(() => shownLogo(page)).toBe("light");
    });
  }

  test("footer shows the white logo, linked home", async ({ page }) => {
    await page.goto("/en/contact");
    const link = page.locator("#site-footer").getByRole("link", { name: "BattamBeef", exact: true });
    await expect(link).toHaveAttribute("href", "/en");
    // One inline SVG: white wordmark, fixed red parts, no image request.
    await expect(link.locator("img")).toHaveCount(0);
    await expect(link.locator("svg.brand-logo path").nth(1)).toHaveCSS("fill", "rgb(245, 243, 239)");
    await expect(link.locator("svg.brand-logo path").nth(0)).toHaveAttribute("fill", "#A30113");
  });

  test("favicon, app icons and the manifest are the real logo", async ({ page, request }) => {
    await page.goto("/en");
    const href = (sel: string) => page.locator(`head ${sel}`).first().getAttribute("href");
    expect(await href('link[rel="icon"][type="image/svg+xml"]')).toMatch(/^\/icon\.svg/);
    expect(await href('link[rel="apple-touch-icon"]')).toMatch(/^\/apple-icon\.png/);
    expect(await href('link[rel="manifest"]')).toBe("/manifest.webmanifest");

    const svg = await request.get("/icon.svg");
    expect(svg.ok()).toBe(true);
    expect(await svg.text()).toContain("#A30113");
    for (const path of ["/favicon.ico", "/apple-icon.png", "/brand/icon-192.png", "/brand/icon-512.png"]) {
      expect((await request.get(path)).ok(), path).toBe(true);
    }
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.name).toBe("BattamBeef");
    expect(manifest.icons.map((i: { src: string }) => i.src)).toEqual(["/brand/icon-192.png", "/brand/icon-512.png"]);
  });
});
