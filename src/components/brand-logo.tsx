import Image from "next/image";
import { cn } from "@/lib/utils";

// The BattamBeef logo files (public/brand). The artwork has no padding of its own: the clear space
// comes from the layout around it. Logo red is #A30113 (official red still being confirmed with
// the designer; the site's brand crimson #7B1E2B is unchanged).
const LOGO = { width: 2224, height: 952 } as const;
const LIGHT = "/brand/battambeef-logo-light.svg"; // white wordmark: for dark and photo-scrolled surfaces
const DARK = "/brand/battambeef-logo-dark.svg"; // charcoal wordmark: for light and kraft surfaces

type BrandLogoProps = {
  /**
   * "light" / "dark": one version. "auto" (header): both, stacked; CSS in globals.css shows the
   * dark one wherever the header text is charcoal and the light one everywhere else.
   */
  variant: "light" | "dark" | "auto";
  /** Size classes, e.g. "h-9" (the width follows the logo's proportions). */
  className?: string;
};

/** Decorative: the link around it carries the accessible name ("BattamBeef"). */
export function BrandLogo({ variant, className }: BrandLogoProps) {
  const img = (src: string, extra?: string) => (
    <Image
      src={src}
      alt=""
      width={LOGO.width}
      height={LOGO.height}
      unoptimized // vector file: served as is
      loading="eager"
      className={cn("block h-full w-auto", extra)}
    />
  );

  if (variant !== "auto") {
    return <span className={cn("block", className)}>{img(variant === "light" ? LIGHT : DARK)}</span>;
  }
  return (
    <span className={cn("relative block", className)}>
      {img(LIGHT, "brand-logo-light")}
      {img(DARK, "brand-logo-dark absolute inset-0")}
    </span>
  );
}
