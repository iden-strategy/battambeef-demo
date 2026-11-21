import { expect, test, type Page } from "@playwright/test";

// Links must work before the page has hydrated: with JavaScript off (plain links), and with
// JavaScript on but a slow network/CPU, when the visitor clicks before "motion-ready".

const LINKS = [
  { from: "/en/business/cuts", name: "Business pricing on request", url: /\/en\/business#enquiry$/, shows: "#enquiry" },
  { from: "/en/business/cuts", name: "About", url: /\/en\/about$/, shows: "main h1" },
] as const;

test.describe("links without JavaScript", () => {
  for (const link of LINKS) {
    test(`"${link.name}" navigates`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(link.from);
      await page.getByRole("link", { name: link.name, exact: true }).first().click();
      await expect(page).toHaveURL(link.url);
      await expect(page.locator(link.shows).first()).toBeVisible();
      await context.close();
    });
  }
});

async function throttle(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}

test.describe("links before motion-ready, slow network", () => {
  for (const link of LINKS) {
    test(`"${link.name}" navigates when clicked before hydration`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: 1440, height: 900 });
      await throttle(page);
      await page.goto(link.from, { waitUntil: "domcontentloaded" });
      const anchor = page.getByRole("link", { name: link.name, exact: true }).first();
      await anchor.waitFor({ state: "attached" });
      const hydratedAtClick = await page.evaluate(() => document.documentElement.classList.contains("motion-ready"));
      const t0 = Date.now();
      await anchor.click({ noWaitAfter: true });
      await expect(page).toHaveURL(link.url, { timeout: 60_000 });
      await expect(page.locator(link.shows).first()).toBeVisible({ timeout: 60_000 });
      console.log(`"${link.name}": clicked ${hydratedAtClick ? "after" : "BEFORE"} motion-ready; page showed after ${Date.now() - t0} ms`);
    });
  }
});
