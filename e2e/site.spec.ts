import { expect, test, type Page } from "@playwright/test";

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];
const PAGES = ["", "/about", "/farm-to-table", "/beef-cuts", "/for-business", "/beef-knowledge", "/contact", "/styleguide"];

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
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThan(400);
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

    // In-view reveals further down are visible too (no JS = no hiding).
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

test.describe("privacy and security", () => {
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
    await page.goto("/en/styleguide");
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
      const op = (sel: string) => Number(getComputedStyle(document.querySelector(`header.site-header ${sel}`)!).opacity);
      return op(".brand-logo-dark") > 0.5 ? "dark" : op(".brand-logo-light") > 0.5 ? "light" : "none";
    });

  for (const width of [360, 1440]) {
    test(`${width}px: header logo follows the surface; named "BattamBeef", links home`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/en/about");
      const link = page.locator("header.site-header").getByRole("link", { name: "BattamBeef", exact: true });
      await expect(link).toHaveAttribute("href", "/en");
      const box = (await link.locator("img").first().boundingBox())!;
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
    await expect(link.locator("img")).toHaveAttribute("src", "/brand/battambeef-logo-light.svg");
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
