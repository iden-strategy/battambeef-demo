// Site structure and contact placeholders.
// Contact details are PLACEHOLDERS until the team provides real ones (CLAUDE.md section 12).

export type NavKey =
  | "home"
  | "about"
  | "farmToTable"
  | "beefCuts"
  | "forBusiness"
  | "beefKnowledge"
  | "contact";

export type NavItem = { key: NavKey; href: string };

export const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "farmToTable", href: "/farm-to-table" },
  { key: "beefCuts", href: "/beef-cuts" },
  { key: "forBusiness", href: "/for-business" },
  { key: "beefKnowledge", href: "/beef-knowledge" },
  { key: "contact", href: "/contact" },
];

export type ContactDetail = {
  key: "phone" | "email" | "telegram" | "address";
  /** null = not provided yet; render the placeholder label instead. */
  value: string | null;
};

export const CONTACT_DETAILS: ContactDetail[] = [
  { key: "phone", value: null },
  { key: "email", value: null },
  { key: "telegram", value: null },
  { key: "address", value: null },
];

export type SocialLink = {
  id: "facebook" | "instagram" | "tiktok" | "telegram";
  name: string;
  /** null = account not provided yet; rendered as a non-link "coming soon". */
  href: string | null;
};

export const SOCIAL_LINKS: SocialLink[] = [
  { id: "facebook", name: "Facebook", href: null },
  { id: "instagram", name: "Instagram", href: null },
  { id: "tiktok", name: "TikTok", href: null },
  { id: "telegram", name: "Telegram", href: null },
];

export const COPYRIGHT_YEAR = 2026;

/** Link preview image (Open Graph). A crop of the hero illustration until a real one exists. */
export const OG_IMAGE = { src: "/images/og/og-placeholder.jpg", width: 1200, height: 630 };

/** Contact page cards. Each lists which CONTACT_DETAILS it shows (placeholders until provided). */
export type ContactCardId = "orders" | "partnerships" | "location";
export type ContactIcon = "shopping-bag" | "handshake" | "map-pin";

export const CONTACT_CARDS: { id: ContactCardId; icon: ContactIcon; details: ContactDetail["key"][] }[] = [
  { id: "orders", icon: "shopping-bag", details: ["phone", "telegram"] },
  { id: "partnerships", icon: "handshake", details: ["email", "phone"] },
  { id: "location", icon: "map-pin", details: ["address"] },
];

/** Contact form enquiry types. A valid "Request a quote" link preselects "order". */
export const ENQUIRY_TYPES = ["order", "partnership", "general"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export type QuickActions = {
  /** Telegram when a handle exists in CONTACT_DETAILS, otherwise the Contact page. */
  contact: { kind: "telegram"; href: string } | { kind: "page"; href: string };
  quote: string;
};

/** Quick actions (mobile bottom bar). The Telegram handle has one source: CONTACT_DETAILS. */
export function buildQuickActions(): QuickActions {
  const handle = CONTACT_DETAILS.find((c) => c.key === "telegram")?.value?.replace(/^@/, "").trim();
  return {
    contact: handle ? { kind: "telegram", href: `https://t.me/${encodeURIComponent(handle)}` } : { kind: "page", href: "/contact" },
    quote: "/for-business",
  };
}
