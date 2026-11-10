import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// File checks (no browser). messages/global-error.json is a small copy for the last-resort error
// page (so the full message files are not in every page's JavaScript); it must not drift.

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

test("global-error.json matches the site's error messages", () => {
  const en = read("messages/en.json");
  const km = read("messages/km.json");
  const ge = read("messages/global-error.json");
  expect(ge.en).toEqual({ siteName: en.meta.siteName, ...en.errors });
  // Khmer: either still TODO-KM in both places, or the same text.
  for (const [key, value] of Object.entries(ge.km as Record<string, string>)) {
    const site = key === "siteName" ? km.meta.siteName : km.errors[key];
    if (value.includes("TODO-KM")) expect(String(site), key).toContain("TODO-KM");
    else expect(site, key).toBe(value);
  }
});
