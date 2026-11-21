import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// File checks (no browser). messages/global-error.json is a small copy for the last-resort error
// page (so the full message files are not in every page's JavaScript); it must not drift.

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

// ---- km.json: every value is real Khmer, except what is agreed to stay English ----------------

type Tree = { [key: string]: string | Tree };
const leaves = (tree: Tree, prefix = ""): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [[`${prefix}${key}`, value] as [string, string]] : leaves(value, `${prefix}${key}.`),
  );

const KHMER_SCRIPT = /[ក-៿]/; // U+1780 to U+17FF

/** Brand lines still waiting for the team's Khmer (CLAUDE.md section 12: TODO-KM, never invented). */
const TODO_KM_KEYS = [
  "meta.titles.home",
  "footer.campaign",
  "home.hero.title",
  "home.marquee",
  "styleguide.type.sampleHero",
  "styleguide.type.sampleXl",
  "styleguide.type.sampleTitle",
  "styleguide.type.sampleLabel",
  "styleguide.type.sampleBody",
  "styleguide.kit.splitEn",
  "styleguide.kit.marqueeItems",
];
/** Proper names and code identifiers that are the same in every language (agreed English). */
const PROPER_NAME_KEYS = [
  "language.en", // "EN", the English switch label
  "language.enFull", // "English", the language's own name
  "footer.telegram", // the product name
  "styleguide.kit.splitTitle", // internal styleguide: component names
  "styleguide.kit.revealTitle",
  "styleguide.kit.imageRevealTitle",
  "styleguide.kit.pillTitle",
  "styleguide.kit.parallaxTitle",
  "styleguide.kit.magneticTitle",
  "styleguide.kit.cursorTitle",
  "styleguide.kit.carouselTitle",
  "styleguide.kit.marqueeTitle",
  "styleguide.kit.countTitle",
  "styleguide.kit.tiltTitle",
  "styleguide.kit.transitionTitle",
];
const ALLOWED_ENGLISH = new Set([...TODO_KM_KEYS, ...PROPER_NAME_KEYS]);

/** Only placeholders ({year}, %s), numbers, punctuation or the brand name: nothing to translate. */
const nothingToTranslate = (value: string) => value.replace(/\{[^}]*\}|%s|BattamBeef|[\d\s\p{P}\p{S}]/gu, "") === "";

test("km.json: every value contains Khmer script, outside the agreed English allow-list", () => {
  const km = leaves(read("messages/km.json"));
  const en = new Map(leaves(read("messages/en.json")));
  const problems: string[] = [];
  for (const [key, value] of km) {
    if (!en.has(key)) problems.push(`${key}: not in en.json`);
    if (ALLOWED_ENGLISH.has(key)) continue;
    if (value.trim() === "") problems.push(`${key}: blank`);
    else if (!KHMER_SCRIPT.test(value) && !nothingToTranslate(value)) problems.push(`${key}: no Khmer (${JSON.stringify(value)})`);
  }
  for (const key of en.keys()) if (!km.some(([k]) => k === key)) problems.push(`${key}: missing in km.json`);
  expect(problems).toEqual([]);
});

test("km.json: the allow-list has no stale entries and TODO-KM stays in the TODO list", () => {
  const km = new Map(leaves(read("messages/km.json")));
  for (const key of ALLOWED_ENGLISH) expect(km.has(key), `${key} is not in km.json (remove it from the allow-list)`).toBe(true);
  // Once a TODO-KM line is translated it must leave the list; no marker may hide outside it.
  for (const key of TODO_KM_KEYS) expect(km.get(key), key).toContain("TODO-KM");
  for (const [key, value] of km) if (value.includes("TODO-KM")) expect(TODO_KM_KEYS, key).toContain(key);
});

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
