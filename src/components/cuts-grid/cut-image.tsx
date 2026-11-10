import Image from "next/image";
import type { Cut } from "@/lib/data/cuts";

type CutImageProps = {
  cut: Cut;
  alt: string;
  /** Shown on the placeholder tile until a real photo exists. */
  soonLabel: string;
  sizes: string;
};

/**
 * A cut photo, or a neutral tile (code + "Photo coming soon") until photos exist.
 * Fills its parent, which sets the size and aspect ratio.
 */
export function CutImage({ cut, alt, soonLabel, sizes }: CutImageProps) {
  if (cut.image) {
    return <Image src={cut.image} alt={alt} fill sizes={sizes} className="object-cover" />;
  }
  return (
    <div className="absolute inset-0 flex flex-col justify-between bg-[var(--charcoal-deep)] p-4" aria-hidden>
      {/* Large text: steel at 50% on the deep charcoal tile is 3.2:1, above the 3:1 large-text minimum. */}
      <span aria-hidden className="tabular font-display text-4xl font-extrabold tracking-tight text-brand-steel/50 md:text-5xl">
        {cut.code ?? ""}
      </span>
      <span aria-hidden className="label text-brand-steel/70">
        {soonLabel}
      </span>
    </div>
  );
}
