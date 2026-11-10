// Brand colour reference for the styleguide. The live values are CSS variables in globals.css;
// keep both in sync.

export type BrandColor = {
  key:
    | "white"
    | "charcoal"
    | "crimson"
    | "crimsonHover"
    | "kraft"
    | "steel"
    | "charcoalDeep"
    | "surfaceRaised"
    | "surfaceLightRaised"
    | "textMuted"
    | "success"
    | "error";
  token: string;
  hex: string;
};

export const BRAND_COLORS: BrandColor[] = [
  { key: "white", token: "--white", hex: "#F5F3EF" },
  { key: "charcoal", token: "--charcoal", hex: "#292B2D" },
  { key: "crimson", token: "--crimson", hex: "#7B1E2B" },
  { key: "crimsonHover", token: "--crimson-hover", hex: "#A8323F" },
  { key: "kraft", token: "--kraft", hex: "#C5A77D" },
  { key: "steel", token: "--steel", hex: "#B9BEC2" },
  { key: "charcoalDeep", token: "--charcoal-deep", hex: "#1F2123" },
  { key: "surfaceRaised", token: "--surface-raised", hex: "#35383B" },
  { key: "surfaceLightRaised", token: "--surface-light-raised", hex: "#EAE6DF" },
  { key: "textMuted", token: "--text-muted-dark", hex: "#B9BEC2" },
  { key: "success", token: "--success-on-dark", hex: "#8FD19E" },
  { key: "error", token: "--error-on-dark", hex: "#FFA070" },
];
