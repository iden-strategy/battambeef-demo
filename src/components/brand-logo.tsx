import { cn } from "@/lib/utils";
import { LOGO_RED_PATH, LOGO_WORDMARK_PATH } from "@/components/brand-logo-paths";

// The BattamBeef logo as one inline SVG: the wordmark takes the text colour (currentColor), the
// red parts are fixed. The artwork has no padding of its own: the clear space comes from the
// layout around it. Logo red is #A30113 (official red still being confirmed with the designer; the
// site's brand crimson #7B1E2B is unchanged). The standalone files in public/brand are for
// everything outside the page (favicon, app icons, sharing).
const LOGO = { width: 2224, height: 952 } as const;

type BrandLogoProps = {
  /**
   * "current": the wordmark follows the surrounding text colour. The header changes that colour
   * with its data-theme (set from the surface under it, see site-header.tsx), so the logo
   * cross-fades with the header and needs no :has() or second file.
   * "light": always the white wordmark (the footer is always dark).
   */
  variant: "current" | "light";
  /** Size classes, e.g. "h-9" (the width follows the logo's proportions). */
  className?: string;
};

/** Decorative: the link around it carries the accessible name ("BattamBeef"). */
export function BrandLogo({ variant, className }: BrandLogoProps) {
  return (
    <svg
      viewBox={`0 0 ${LOGO.width} ${LOGO.height}`}
      aria-hidden="true"
      focusable="false"
      className={cn("brand-logo block h-full w-auto", variant === "light" && "text-brand-white", className)}
    >
      <path fill="#A30113" fillRule="evenodd" d={LOGO_RED_PATH} />
      <path fill="currentColor" fillRule="evenodd" d={LOGO_WORDMARK_PATH} />
    </svg>
  );
}
