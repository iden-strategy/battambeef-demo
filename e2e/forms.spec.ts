import { expect, test, type Page } from "@playwright/test";
import { isCambodianPhone, isEmail, validateBusiness, validateContact } from "@/components/forms/validation";
import { getCowMap, getCuts } from "@/lib/data";
import { parseQuoteParams, type QuoteAllowList } from "@/lib/quote-link";

// Rules (no browser): the quote-link parser and the form validators.

const allow: QuoteAllowList = {
  parts: getCowMap().parts.map((p) => p.id),
  cuts: getCuts().map((c) => ({ id: c.id, parts: c.parts })),
};
const parse = (query: string) => parseQuoteParams(new URLSearchParams(query), allow);

test.describe("quote link parameters", () => {
  test("known part and cut are accepted", () => {
    expect(parse("part=loin")).toEqual({ part: "loin", cut: null });
    expect(parse("part=loin&cut=striploin")).toEqual({ part: "loin", cut: "striploin" });
    // A cut on its own brings its part.
    expect(parse("cut=ribeye")).toEqual({ part: "rib", cut: "ribeye" });
  });

  test("unknown, malicious and oversized values are ignored", () => {
    const bad = [
      "",
      "part=",
      "part=Loin",
      "part=loin%20",
      "part=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
      "part=<script>alert(1)</script>",
      'part="><img src=x onerror=alert(1)>',
      "part=javascript:alert(1)",
      "part=__proto__",
      "part=constructor",
      "part=toString",
      "cut=__proto__",
      "cut=../../etc/passwd",
      `part=${"a".repeat(10_000)}`,
      `cut=${"ribeye".repeat(2_000)}`,
      "part[]=loin",
      "PART=loin",
    ];
    for (const query of bad) expect(parse(query), query).toBeNull();
  });

  test("a valid ID next to junk keeps only the valid ID", () => {
    expect(parse("part=<script>&cut=ribeye")).toEqual({ part: "rib", cut: "ribeye" });
    expect(parse("part=loin&cut=<img onerror=x>")).toEqual({ part: "loin", cut: null });
    expect(parse(`part=loin&cut=${"x".repeat(5000)}`)).toEqual({ part: "loin", cut: null });
  });

  test("a cut from another part is dropped; the part stays", () => {
    expect(parse("part=loin&cut=brisket")).toEqual({ part: "loin", cut: null });
    expect(parse("part=rib&cut=shin")).toEqual({ part: "rib", cut: null });
  });

  test("a cut from two parts is accepted with either part; on its own it brings the first", () => {
    expect(parse("part=fore-shank&cut=shin")).toEqual({ part: "fore-shank", cut: "shin" });
    expect(parse("part=hind-shank&cut=shin")).toEqual({ part: "hind-shank", cut: "shin" });
    expect(parse("cut=shin")).toEqual({ part: "fore-shank", cut: "shin" });
  });

  test("a cut that is not on the map comes without a part", () => {
    expect(parse("cut=soup-bones")).toEqual({ part: null, cut: "soup-bones" });
    expect(parse("cut=trimmings-mince")).toEqual({ part: null, cut: "trimmings-mince" });
    // A part next to it does not belong to it: the part stays, the cut is dropped.
    expect(parse("part=neck&cut=soup-bones")).toEqual({ part: "neck", cut: null });
  });

  test("old cut IDs from earlier versions of the site are ignored; old part IDs still work", () => {
    for (const old of ["neck", "chuck", "plate", "flank", "fore-shank", "hind-shank"]) {
      expect(parse(`cut=${old}`), old).toBeNull();
      expect(parse(`part=${old}&cut=${old}`), old).toEqual({ part: old, cut: null });
    }
  });

  test("repeated parameters: only the first counts", () => {
    expect(parse("part=loin&part=rib")).toEqual({ part: "loin", cut: null });
    expect(parse("part=<b>&part=rib")).toBeNull();
  });

  test("the result only ever holds IDs from the data", () => {
    const parts = new Set(allow.parts);
    const cuts = new Set(allow.cuts.map((c) => c.id));
    for (const query of ["part=rib", "cut=tenderloin", "part=round&cut=topside", "part=x&cut=y", "cut=soup-bones", "cut=shin"]) {
      const r = parse(query);
      if (r) {
        if (r.part !== null) expect(parts.has(r.part)).toBe(true);
        if (r.cut) expect(cuts.has(r.cut)).toBe(true);
      }
    }
  });
});

test.describe("form rules", () => {
  test("Cambodian phone formats", () => {
    for (const ok of ["012 345 678", "012345678", "0123456789", "023 123 456", "+855 12 345 678", "855-12-345-678", "+855 (0)12 345 678", "097.123.4567", "+85597 123 4567"]) {
      expect(isCambodianPhone(ok), ok).toBe(true);
    }
    for (const bad of ["", "12 345 678", "0012345678", "01234567", "012345678901", "+66 12 345 678", "+855 0 12", "abc", "012-345-67a", "+1 555 123 4567"]) {
      expect(isCambodianPhone(bad), bad).toBe(false);
    }
  });

  test("email", () => {
    expect(isEmail("name@example.com")).toBe(true);
    expect(isEmail("first.last@sub.example.com.kh")).toBe(true);
    for (const bad of ["name", "name@", "@example.com", "name@example", "na me@example.com", `${"a".repeat(250)}@example.com`]) {
      expect(isEmail(bad), bad).toBe(false);
    }
  });

  const contactRules = { enquiryTypes: ["order", "partnership", "general"], interests: ["part:loin", "cut:striploin"] };

  test("contact form: required fields, formats and lists", () => {
    expect(validateContact({}, contactRules)).toEqual({
      name: "fields.name.errorRequired",
      phone: "fields.phone.errorRequired",
      enquiryType: "fields.enquiryType.errorRequired",
      message: "fields.message.errorShort",
    });
    const good = { name: "Dara", phone: "012 345 678", enquiryType: "order", message: "Ten characters or more", interest: "cut:striploin" };
    expect(validateContact(good, contactRules)).toEqual({});
    expect(validateContact({ ...good, phone: "12345" }, contactRules)).toEqual({ phone: "fields.phone.errorFormat" });
    expect(validateContact({ ...good, email: "nope" }, contactRules)).toEqual({ email: "fields.email.errorFormat" });
    expect(validateContact({ ...good, enquiryType: "<script>" }, contactRules)).toEqual({ enquiryType: "fields.enquiryType.errorRequired" });
    expect(validateContact({ ...good, interest: "cut:unknown" }, contactRules)).toEqual({ interest: "fields.interest.errorInvalid" });
    expect(validateContact({ ...good, name: "x".repeat(101) }, contactRules)).toEqual({ name: "errors.tooLong" });
    expect(validateContact({ ...good, name: "   " }, contactRules)).toEqual({ name: "fields.name.errorRequired" });
  });

  test("business form: required fields and the cuts list", () => {
    const rules = { businessTypes: ["restaurant"], volumes: ["under20"], cuts: ["ribeye", "brisket"] };
    expect(validateBusiness({ cuts: [] }, rules)).toEqual({
      businessName: "fields.businessName.errorRequired",
      contactName: "fields.contactName.errorRequired",
      phone: "fields.phone.errorRequired",
      businessType: "fields.businessType.errorRequired",
    });
    const good = { businessName: "Kitchen", contactName: "Sophea", phone: "+855 12 345 678", businessType: "restaurant", cuts: ["ribeye"] };
    expect(validateBusiness(good, rules)).toEqual({});
    expect(validateBusiness({ ...good, cuts: ["ribeye", "wagyu"] }, rules)).toEqual({ cuts: "fields.cuts.errorInvalid" });
    expect(validateBusiness({ ...good, volume: "1000t" }, rules)).toEqual({ volume: "fields.volume.errorInvalid" });
  });
});

// Browser checks: the forms validate, announce errors, show "Preview only: not sent", and never
// send or store what was typed.

const SECRET = "Zz-unique-7731";

/** Records every request and every storage/cookie write made after this call. */
async function watchLeaks(page: Page) {
  const requests: { method: string; url: string; body: string | null }[] = [];
  page.on("request", (r) => requests.push({ method: r.method(), url: r.url(), body: r.postData() }));
  await page.addInitScript(() => {
    const w = window as unknown as { __writes: string[] };
    w.__writes = [];
    for (const store of [window.localStorage, window.sessionStorage]) {
      const set = store.setItem.bind(store);
      store.setItem = (k: string, v: string) => {
        w.__writes.push(`${k}=${v}`);
        set(k, v);
      };
    }
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, "cookie")!;
    Object.defineProperty(document, "cookie", {
      get: () => desc.get!.call(document),
      set: (v: string) => {
        w.__writes.push(`cookie:${v}`);
        desc.set!.call(document, v);
      },
    });
  });
  return {
    requests,
    writes: () => page.evaluate(() => (window as unknown as { __writes: string[] }).__writes),
  };
}

test.describe("business enquiry form", () => {
  test("empty submit: error summary gets focus, fields are marked, errors clear when fixed", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/for-business#enquiry");
    const form = page.locator("#business-form");
    await expect(form.getByRole("button", { name: "Send enquiry" })).toBeEnabled();
    await form.getByRole("button", { name: "Send enquiry" }).click();

    const summary = form.locator("div[tabindex=\"-1\"]");
    await expect(summary).toBeFocused();
    await expect(summary).toContainText("There are 4 problems with this form.");
    await expect(form.getByLabel("Business name")).toHaveAttribute("aria-invalid", "true");
    await expect(form.locator("#business-form-businessName-error")).toHaveText("Enter your business name.");
    // The error is part of the field's accessible description.
    await expect(form.getByLabel("Business name")).toHaveAccessibleDescription("Enter your business name.");

    // A summary link moves focus to its field.
    await summary.getByRole("link", { name: "Enter a phone number." }).click();
    await expect(form.getByLabel("Phone")).toBeFocused();

    await form.getByLabel("Phone").fill("12345");
    await expect(form.locator("#business-form-phone-error")).toHaveText("Enter a Cambodian phone number, for example 012 345 678.");
    await form.getByLabel("Phone").fill("012 345 678");
    await expect(form.locator("#business-form-phone-error")).toHaveCount(0);
    await expect(summary).toContainText("There are 3 problems with this form.");
  });

  test("valid submit: loading, then 'Preview only: not sent'; nothing sent or stored", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const leaks = await watchLeaks(page);
    await page.goto("/en/for-business");
    const form = page.locator("#business-form");
    await form.scrollIntoViewIfNeeded();
    const before = leaks.requests.length;

    await form.getByLabel("Business name").fill(`Kitchen ${SECRET}`);
    await form.getByLabel("Contact name").fill(`Sophea ${SECRET}`);
    await form.getByLabel("Phone").fill("+855 12 345 678");
    await form.getByLabel("Email").fill(`a${SECRET.toLowerCase()}@example.com`);
    await form.getByLabel("Business type").selectOption("restaurant");
    await form.getByLabel("Estimated weekly volume").selectOption("20to50");
    await form.getByText("Ribeye (cube roll)").click();
    await form.getByText("Brisket", { exact: true }).click();
    await form.getByLabel("Delivery area").fill(`Battambang ${SECRET}`);
    await form.getByLabel("Message").fill(`Hello ${SECRET}`);
    await form.getByRole("button", { name: "Send enquiry" }).click();

    await expect(form.getByRole("button", { name: "Sending…" })).toBeVisible();
    await expect(form.getByRole("button", { name: "Preview only: not sent" })).toBeVisible();
    await expect(form.getByRole("status")).toContainText("Preview only: not sent");
    await expect(form.locator("div[tabindex=\"-1\"]")).toHaveCount(0);

    const after = leaks.requests.slice(before);
    expect(after.filter((r) => r.method !== "GET"), "no POST/PUT").toEqual([]);
    expect(after.filter((r) => r.url.includes(SECRET) || r.body?.includes(SECRET))).toEqual([]);
    expect((await leaks.writes()).filter((w) => w.includes(SECRET) || w.includes("Sophea"))).toEqual([]);
    expect(page.url()).not.toContain(SECRET);

    // Editing again returns the button to "Send enquiry".
    await form.getByLabel("Message").fill("Changed");
    await expect(form.getByRole("button", { name: "Send enquiry" })).toBeVisible();
  });

  test("without JavaScript the form cannot be submitted", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/en/for-business");
    await expect(page.locator("#business-form").getByRole("button", { name: "Send enquiry" })).toBeDisabled();
    await page.locator("#business-form-businessName").fill("x");
    await page.locator("#business-form-businessName").press("Enter");
    await expect(page).toHaveURL(/\/en\/for-business$/);
    await context.close();
  });

  test("hero 'Request a quote' jumps to the form; autocomplete hints are set", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/for-business");
    await page.locator("#main-content").getByRole("link", { name: "Request a quote" }).click();
    await expect(page).toHaveURL(/#enquiry$/);
    await expect(page.locator("#enquiry-heading")).toBeInViewport();
    const ac = (id: string) => page.locator(`#business-form-${id}`).getAttribute("autocomplete");
    expect(await ac("businessName")).toBe("organization");
    expect(await ac("contactName")).toBe("name");
    expect(await ac("phone")).toBe("tel");
    expect(await ac("email")).toBe("email");
  });
});

test.describe("contact form", () => {
  const enquiry = (page: Page) => page.locator("#contact-form-enquiryType");
  const interest = (page: Page) => page.locator("#contact-form-interest");

  test("a quote link with a known cut preselects 'Order enquiry' and the cut", async ({ page }) => {
    await page.goto("/en/contact?part=loin&cut=striploin");
    await expect(enquiry(page)).toHaveValue("order");
    await expect(interest(page)).toHaveValue("cut:striploin");
    await expect(enquiry(page).locator("option:checked")).toHaveText("Order enquiry");
    await expect(page.getByText("We have filled in the cut from your quote request.")).toBeVisible();

    await page.goto("/en/contact?part=rib");
    await expect(interest(page)).toHaveValue("part:rib");
    await expect(interest(page).locator("option:checked")).toHaveText("Any Rib cut");
  });

  test("quote links for a two-part cut and a cut that is not on the map", async ({ page }) => {
    await page.goto("/en/contact?part=hind-shank&cut=shin");
    await expect(interest(page)).toHaveValue("cut:shin");
    await page.goto("/en/contact?cut=soup-bones");
    await expect(interest(page)).toHaveValue("cut:soup-bones");
    await expect(interest(page).locator("option:checked")).toHaveText("Soup bones (leg, neck, hip)");
    // Shin is listed under both shanks; bones and trimmings have their own group.
    await expect(interest(page).locator("option[value='cut:shin']")).toHaveCount(2);
    await expect(interest(page).locator("optgroup[label='Bones and trimmings'] option")).toHaveText(["Trimmings for mince", "Soup bones (leg, neck, hip)"]);
  });

  test("arriving from the cut map's quote button (client navigation) preselects the part", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/beef-cuts#loin");
    await page.getByRole("link", { name: "Request a quote for Loin cuts" }).click();
    await expect(page).toHaveURL(/\/en\/contact\?part=loin$/);
    await expect(interest(page)).toHaveValue("part:loin");
    await expect(enquiry(page)).toHaveValue("order");
  });

  const malicious = [
    "part=%3Cscript%3Ewindow.__pwned%3D1%3C%2Fscript%3E",
    "cut=%22%3E%3Cimg%20src%3Dx%20onerror%3D%22window.__pwned%3D1%22%3E",
    "part=javascript%3Awindow.__pwned%3D1",
    "part=__proto__&cut=constructor",
    `part=${"loin".repeat(3000)}`,
    `cut=${"A".repeat(5000)}`,
    "part=Loin&cut=STRIPLOIN",
  ];

  for (const query of malicious) {
    test(`ignores unknown or malicious values: ${query.slice(0, 50)}`, async ({ page }) => {
      const dialogs: string[] = [];
      page.on("dialog", (d) => {
        dialogs.push(d.message());
        void d.dismiss();
      });
      await page.goto(`/en/contact?${query}`);
      await expect(page.locator("#contact-form")).toBeVisible();
      await expect(page.locator("#contact-form").getByRole("button", { name: "Send message" })).toBeEnabled();
      await expect(enquiry(page)).toHaveValue("");
      await expect(interest(page)).toHaveValue("");
      await expect(page.getByText("We have filled in the cut")).toHaveCount(0);
      // Nothing from the query reaches the page: not as text, not as markup. (The language switch
      // links keep the query string, URL-encoded inside their href, so the page can be switched
      // without losing it; those hrefs are left out here.)
      const raw = new URLSearchParams(query);
      const html = await page.evaluate(() => {
        const copy = document.body.cloneNode(true) as HTMLElement;
        copy.querySelectorAll("a[hreflang]").forEach((a) => a.removeAttribute("href"));
        return copy.innerHTML;
      });
      for (const value of raw.values()) {
        if (value.length > 3 && !["Loin", "STRIPLOIN"].includes(value)) expect(html).not.toContain(value.slice(0, 40));
      }
      expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
      expect(await page.locator("img[src='x']").count()).toBe(0);
      expect(dialogs).toEqual([]);
    });
  }

  test("a URL longer than the server's header limit is refused before any page code runs", async ({ request }) => {
    const res = await request.get(`/en/contact?cut=${"A".repeat(20_000)}`);
    expect(res.status()).toBe(431);
  });

  test("validation, preview state and no sending; autocomplete hints", async ({ page }) => {
    const leaks = await watchLeaks(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/contact");
    const form = page.locator("#contact-form");
    await form.getByRole("button", { name: "Send message" }).click();
    await expect(form.locator("div[tabindex=\"-1\"]")).toBeFocused();
    await expect(form.locator("div[tabindex=\"-1\"]")).toContainText("There are 4 problems with this form.");
    await expect(form.getByLabel("Message")).toHaveAccessibleDescription("Write a short message (at least 10 characters).");

    const before = leaks.requests.length;
    await form.getByLabel("Your name").fill(`Dara ${SECRET}`);
    await form.getByLabel("Company").fill(`Cafe ${SECRET}`);
    await form.getByLabel("Phone").fill("097 123 4567");
    await form.getByLabel("Email").fill("dara@example.com");
    await form.getByLabel("Enquiry type").selectOption("general");
    await form.getByLabel("Message").fill(`Hello there ${SECRET}`);
    await expect(form.locator("div[tabindex=\"-1\"]")).toHaveCount(0);
    await form.getByRole("button", { name: "Send message" }).click();
    await expect(form.getByRole("button", { name: "Preview only: not sent" })).toBeVisible();
    const after = leaks.requests.slice(before);
    expect(after.filter((r) => r.method !== "GET")).toEqual([]);
    expect(after.filter((r) => r.url.includes(SECRET) || r.body?.includes(SECRET))).toEqual([]);
    expect((await leaks.writes()).filter((w) => w.includes(SECRET))).toEqual([]);

    const ac = (id: string) => page.locator(`#contact-form-${id}`).getAttribute("autocomplete");
    expect(await ac("name")).toBe("name");
    expect(await ac("company")).toBe("organization");
    expect(await ac("phone")).toBe("tel");
    expect(await ac("email")).toBe("email");
  });

  test("Khmer page: form errors fall back to English, marked lang=en", async ({ page }) => {
    await page.goto("/km/contact");
    const form = page.locator("#contact-form");
    await form.locator("button[type=submit]").click();
    const error = form.locator("#contact-form-name-error");
    await expect(error).toHaveText("Enter your name.");
    await expect(error).toHaveAttribute("lang", "en");
  });
});
