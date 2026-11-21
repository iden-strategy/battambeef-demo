// About page: order, icons and images. All wording lives in messages (about.*).
// CLAUDE.md section 12: only verified facts (Battambang origin, 72-hour chilling, a slaughterhouse
// partner in Battambang, never named). The landscape photo is an AI-generated illustration.

/** Icon names, mapped to lucide icons in the component (data stays free of React). */
export type AboutIcon = "map-pin" | "shield-check" | "chef-hat" | "sparkles" | "users";

export type ValueId = "proudlyLocal" | "trustworthy" | "culinaryExcellence" | "modernProgressive" | "peopleFirst";

export const VALUES: { id: ValueId; icon: AboutIcon }[] = [
  { id: "proudlyLocal", icon: "map-pin" },
  { id: "trustworthy", icon: "shield-check" },
  { id: "culinaryExcellence", icon: "chef-hat" },
  { id: "modernProgressive", icon: "sparkles" },
  { id: "peopleFirst", icon: "users" },
];

/**
 * Hero band: the wide rice-field photo (a white cow in a field; formerly the Home hero photo).
 * story: null until a real photo of the team or region exists ("Photo coming soon" panel).
 */
export const ABOUT_IMAGES: { hero: { src: string; width: number; height: number }; story: string | null } = {
  hero: { src: "/images/hero/hero-wide.webp", width: 2912, height: 1638 },
  story: null,
};
