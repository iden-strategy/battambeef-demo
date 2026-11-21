import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { getCuts } from "@/lib/data";
import { CUT_PRICING, type PriceOption } from "@/lib/data/cut-prices";
import { formatPriceAmount, priceNumberLocale, showsSampleLabel, toCutPriceView } from "@/lib/prices";
import { waitForMotionReady } from "./helpers";

// Sample retail (B2C) prices on the Beef Cuts cut cards (CLAUDE.md section 12): every card shows
// its first price option, the page says once that the prices are samples, and no other page shows
// a consumer price.

const cards = (page: Page) => page.locator("#all-cuts ul.grid > li");
const unitLabel = (o: PriceOption) =>
  o.unit === "kg" ? "per kg" : o.unit === "piece" ? `per ~${o.pieceWeight} g piece` : `per ${o.packSize} g pack`;

test.describe("cut prices: data and logic (no browser)", () => {
  test("one price list per cut, every option well formed", () => {
    expect(Object.keys(CUT_PRICING.prices).sort()).toEqual(getCuts().map((c) => c.id).sort());
    for (const [id, options] of Object.entries(CUT_PRICING.prices)) {
      expect(options.length, id).toBeGreaterThan(0);
      for (const o of options) {
        expect(o.amount, id).toBeGreaterThan(0);
        expect(o.currency, id).toMatch(/^[A-Z]{3}$/);
        expect(Intl.supportedValuesOf("currency"), id).toContain(o.currency);
        // pieceWeight only and always on pieces, packSize only and always on packs.
        const extra = o as { pieceWeight?: unknown; packSize?: unknown };
        if (o.unit === "piece") expect(o.pieceWeight, id).toBeGreaterThan(0);
        else expect(extra.pieceWeight, id).toBeUndefined();
        if (o.unit === "pack") expect(o.packSize, id).toBeGreaterThan(0);
        else expect(extra.packSize, id).toBeUndefined();
      }
    }
  });

  test("the file is marked TODO-VERIFY and is still a sample", () => {
    expect(readFileSync("src/lib/data/cut-prices.ts", "utf8")).toContain("TODO-VERIFY");
    expect(CUT_PRICING.status).toBe("sample");
  });

  test("amounts use the currency's own format; cents only when there are any", () => {
    expect(formatPriceAmount({ amount: 12, currency: "USD" }, "en")).toBe("$12");
    expect(formatPriceAmount({ amount: 6.5, currency: "USD" }, "en")).toBe("$6.50");
    // KHR later: no component change, the currency field drives the format.
    expect(formatPriceAmount({ amount: 48000, currency: "KHR" }, "km")).toBe("48,000៛");
    expect(toCutPriceView([{ amount: 12, currency: "USD", unit: "piece", pieceWeight: 300 }, { amount: 28, currency: "USD", unit: "kg" }], "en"))
      .toEqual({ amount: "$12", unit: "piece", size: 300, more: 1 });
    expect(toCutPriceView(undefined, "en")).toBeUndefined();
  });

  test("the sample note shows only while the status is sample", () => {
    expect(showsSampleLabel("sample")).toBe(true);
    expect(showsSampleLabel("verified")).toBe(false);
  });

  test("one switch for the number format: the page locale only when every price string is translated", () => {
    const allEnglish = () => "en" as const;
    const allTranslated = () => undefined;
    const onlyUnitsTranslated = (key: string) => (key.includes(".units.") ? undefined : ("en" as const));
    expect(priceNumberLocale("km", allEnglish)).toBe("en");
    expect(priceNumberLocale("km", onlyUnitsTranslated)).toBe("en");
    expect(priceNumberLocale("km", allTranslated)).toBe("km");
    expect(priceNumberLocale("en", allTranslated)).toBe("en");
  });
});

test.describe("cut prices: Beef Cuts page", () => {
  test("every cut card shows its retail price, unit and '+N more'", async ({ page }) => {
    await page.goto("/en/business/cuts");
    await page.locator("#all-cuts").scrollIntoViewIfNeeded();
    await expect(cards(page)).toHaveCount(20);
    const byName = new Map(getCuts().map((c) => [c.nameEn, c.id]));
    for (const card of await cards(page).all()) {
      const name = (await card.locator("span[lang=en]").first().textContent())!;
      const options = CUT_PRICING.prices[byName.get(name)!];
      const price = card.locator("[data-cut-price]");
      await expect(price, name).toHaveCount(1);
      await expect(price, name).toContainText("Retail price");
      const amount = price.locator("[data-price-amount]");
      await expect(amount, name).toHaveText(/^\$\d+(\.\d{2})?$/);
      await expect(amount, name).toHaveText(formatPriceAmount(options[0], "en"));
      await expect(price.locator("[data-price-unit]"), name).toHaveText(unitLabel(options[0]));
      if (options.length > 1) {
        const n = options.length - 1;
        await expect(price.locator("[data-price-more-visible]"), name).toHaveText(`+${n} more`);
        await expect(price.locator("[data-price-more-visible]"), name).toHaveAttribute("aria-hidden", "true");
        // Screen readers get the full phrase from the visually hidden text.
        await expect(price.locator("[data-price-more-sr]"), name).toHaveText(`+${n} more price options`);
        await expect(price.locator("[data-price-more-sr]"), name).toHaveClass(/sr-only/);
      } else await expect(price.locator("[data-price-more]"), name).toHaveCount(0);
      // The status is "sample": every card carries the small tag inside its price block.
      await expect(price.locator("[data-sample-tag]"), name).toHaveText("Sample");
    }
    // A piece shows its approximate weight; a pack shows its size.
    const ribeye = cards(page).filter({ hasText: "Ribeye (cube roll)" });
    await expect(ribeye.locator("[data-price-unit]")).toHaveText("per ~300 g piece");
    const mince = cards(page).filter({ hasText: "Trimmings for mince" });
    await expect(mince.locator("[data-price-unit]")).toHaveText("per 500 g pack");
    // No buy button: each card is still the one button that opens the detail.
    await expect(page.locator("#all-cuts").getByRole("button", { name: /add to cart|buy/i })).toHaveCount(0);
  });

  test("one sample note on the page; business pricing link goes to the inquiry form", async ({ page }) => {
    await page.goto("/en/business/cuts");
    const note = page.locator("[data-sample-note]");
    await expect(note).toHaveCount(1);
    await expect(note).toHaveText("Sample prices, for illustration only.");
    const link = page.locator("[data-price-note]").getByRole("link", { name: "Business pricing on request" });
    await expect(link).toHaveAttribute("href", "/en/business#enquiry");
    await waitForMotionReady(page); // client-side navigation needs the page hydrated
    await link.click();
    await expect(page).toHaveURL(/\/en\/business#enquiry$/);
    await expect(page.locator("#enquiry")).toBeVisible();
  });

  test("business pricing link works when clicked just as the 'All cuts' heading starts its reveal", async ({ page }) => {
    // Scrolling to the link brings the heading above it into view, and its letters start their
    // rise 0.6em below their place, over the top of the link. Under load, clicks landed on those
    // letters and nothing happened. Each round holds the letters at the first frame of their
    // reveal (the riskiest moment), checks that they really overlap the link, and clicks.
    const pieces = "#all-cuts-heading [data-piece]";
    for (let round = 1; round <= 5; round++) {
      await page.goto("/en/business/cuts");
      await waitForMotionReady(page);
      const link = page.locator("[data-price-note]").getByRole("link", { name: "Business pricing on request" });
      await link.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
      await page.waitForFunction((sel) => [...document.querySelectorAll(sel)].some((p) => p.getAnimations().length > 0), pieces);
      await page.evaluate((sel) => {
        for (const p of document.querySelectorAll(sel))
          for (const a of p.getAnimations()) {
            a.pause();
            a.currentTime = Number(a.effect?.getTiming().delay ?? 0);
          }
      }, pieces);
      const overlap = await page.evaluate((sel) => {
        const l = document.querySelector("[data-price-note] a")!.getBoundingClientRect();
        return [...document.querySelectorAll(sel)].some((p) => {
          const r = p.getBoundingClientRect();
          return r.bottom > l.top && r.top < l.bottom && r.right > l.left && r.left < l.right;
        });
      }, pieces);
      expect(overlap, `round ${round}: the rising letters overlap the link`).toBe(true);
      await link.click();
      await expect(page, `round ${round}`).toHaveURL(/\/en\/business#enquiry$/);
      await expect(page.locator("#enquiry-heading"), `round ${round}`).toBeInViewport();
    }
  });

  test("client payload: the cards' price strings only; sample note and business link stay on the server", async ({ request }) => {
    const html = await (await request.get("/en/business/cuts")).text();
    expect(html).toContain('\\"sampleTag\\"');
    expect(html).toContain('\\"moreAria\\"');
    expect(html).not.toContain('\\"sampleNote\\"');
    expect(html).not.toContain('\\"businessLink\\"');
  });

  test("Khmer page: every price string is Khmer, so amounts use the Khmer number format", async ({ page }) => {
    // All price strings are translated in km.json, so priceNumberLocale switches to "km" ("12$").
    const km = JSON.parse(readFileSync("messages/km.json", "utf8")).beefCuts.grid.price;
    const kmUnit = (o: PriceOption) =>
      String(km.units[o.unit]).replace("{size}", String(o.unit === "piece" ? o.pieceWeight : o.unit === "pack" ? o.packSize : ""));
    await page.goto("/km/business/cuts");
    await page.locator("#all-cuts").scrollIntoViewIfNeeded();
    await expect(cards(page)).toHaveCount(20);
    await expect(page.locator("[data-cut-price]")).toHaveCount(20);
    const byName = new Map(getCuts().map((c) => [c.nameEn, c.id]));
    for (const card of await cards(page).all()) {
      const name = (await card.locator("span[lang=en]").first().textContent())!;
      const options = CUT_PRICING.prices[byName.get(name)!];
      const price = card.locator("[data-cut-price]");
      const amount = price.locator("[data-price-amount]");
      await expect(amount, name).toHaveText(formatPriceAmount(options[0], "km"));
      await expect(amount, name).toHaveText(/^\d+(\.\d{2})?\$$/);
      await expect(price.locator("[data-price-unit]"), name).toHaveText(kmUnit(options[0]));
      await expect(price.locator("[data-sample-tag]"), name).toHaveText(km.sampleTag);
      // Translated text is not marked as English any more.
      for (const sel of ["[data-price-unit]", "[data-sample-tag]"]) {
        expect(await price.locator(sel).getAttribute("lang"), `${name} ${sel}`).toBeNull();
      }
      if (options.length > 1) {
        const n = String(options.length - 1);
        await expect(price.locator("[data-price-more-visible]"), name).toHaveText(km.more.replace("{count}", n));
        await expect(price.locator("[data-price-more-sr]"), name).toHaveText(km.moreAria.replace("{count}", n));
      }
    }
    await expect(page.locator("[data-sample-note]")).toHaveCount(1);
    await expect(page.locator("[data-sample-note]")).toHaveText(km.sampleNote);
    await expect(page.locator("[data-price-note] a")).toHaveText(km.businessLink);
    await expect(page.locator("[data-price-note] a")).toHaveAttribute("href", "/km/business#enquiry");
  });

  for (const locale of ["en", "km"]) {
    test(`360px (${locale}): no sideways scroll, every price fits its card`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(`/${locale}/business/cuts`);
      await page.locator("#all-cuts").scrollIntoViewIfNeeded();
      await expect(page.locator("[data-cut-price]")).toHaveCount(20);
      const problems = await page.locator("[data-cut-price]").evaluateAll((els) =>
        els.flatMap((el) => {
          const card = el.closest("button")!.getBoundingClientRect();
          const row = el.getBoundingClientRect();
          const inside = row.left >= card.left - 0.5 && row.right <= card.right + 0.5;
          return inside && el.scrollWidth <= el.clientWidth ? [] : [el.textContent];
        }),
      );
      expect(problems).toEqual([]);
      const note = await page.locator("[data-price-note]").evaluate((el) => el.scrollWidth <= el.clientWidth);
      expect(note).toBe(true);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over).toBeLessThanOrEqual(0);
    });
  }

  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`${width}px: CLS 0 while loading and scrolling through the cut cards`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        const w = window as unknown as { __cls: number; __shifts: string[] };
        w.__cls = 0;
        w.__shifts = [];
        new PerformanceObserver((list) => {
          for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: { node?: Node }[] })[]) {
            if (e.hadRecentInput) continue;
            w.__cls += e.value;
            const nodes = (e.sources ?? []).map((s) => (s.node instanceof Element ? `${s.node.tagName}.${s.node.className}`.slice(0, 80) : String(s.node)));
            w.__shifts.push(`${e.value.toFixed(4)} @${Math.round(e.startTime)}ms ${nodes.join(" | ")}`);
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto("/en/business/cuts", { waitUntil: "load" });
      // Scroll down one screen at a time to the end of the grid, letting each step paint.
      const end = await page.locator("#all-cuts").evaluate((el) => el.getBoundingClientRect().bottom + window.scrollY);
      for (let y = 0; y < end; y += height * 0.8) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(500);
      const { cls, shifts } = await page.evaluate(() => {
        const w = window as unknown as { __cls: number; __shifts: string[] };
        return { cls: w.__cls, shifts: w.__shifts };
      });
      expect(cls, shifts.join("\n")).toBe(0);
    });
  }
});

test.describe("cut prices: nowhere else", () => {
  for (const locale of ["en", "km"]) {
    for (const path of ["", "/business", "/business/knowledge", "/about", "/contact"]) {
      test(`/${locale}${path} shows no consumer prices`, async ({ page }) => {
        await page.goto(`/${locale}${path}`);
        await expect(page.locator("[data-cut-price], [data-price-note], [data-sample-note]")).toHaveCount(0);
        // Visible page text only (the message payload in <script> tags is not shown).
        const text = await page.evaluate(() => {
          const body = document.body.cloneNode(true) as HTMLElement;
          body.querySelectorAll("script, style, template, noscript").forEach((el) => el.remove());
          return body.textContent ?? "";
        });
        expect(text).not.toMatch(/Retail price|Sample prices|\$\s?\d|\d\s?\$|\bUSD\b|៛/);
      });
    }
  }
});
