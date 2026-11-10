import Image from "next/image";
import { JourneyVersionOnly, type JourneyVersion } from "@/components/farm-to-table/journey-version";

type StageMediaProps = {
  image: string | null;
  /** "01" … "05": the big mark on the placeholder. */
  number: string;
  /** Stage title: the photo's alt text, and the name on the placeholder. */
  name: string;
  nameLang?: string;
  soonLabel: string;
  soonLang?: string;
  /** The journey version this copy belongs to: its photo is only rendered while that version runs. */
  version: JourneyVersion;
  sizes: string;
};

/**
 * A journey stage's photo, or a placeholder frame (stage number + name) until photos arrive.
 * Fills its parent, which sets the 4:5 frame, so a real photo drops in without any layout shift.
 * The journey is below the fold: photos are lazy, never priority, and the hidden version's photos
 * are not rendered at all (JourneyVersionOnly), so they are never downloaded.
 */
export function StageMedia({ image, number, name, nameLang, soonLabel, soonLang, version, sizes }: StageMediaProps) {
  if (image) {
    return (
      <JourneyVersionOnly version={version}>
        <Image src={image} alt={name} fill sizes={sizes} loading="lazy" className="object-cover" />
      </JourneyVersionOnly>
    );
  }
  return (
    <div aria-hidden className="stage-placeholder @container absolute inset-0 overflow-hidden">
      <span className="tabular absolute -right-[0.04em] -bottom-[0.17em] font-display text-[68cqi] leading-none font-black tracking-[-0.06em] text-foreground/[0.06]">
        {number}
      </span>
      <span className="label absolute top-5 left-5 text-muted-foreground" lang={soonLang}>
        {soonLabel}
      </span>
      <span className="title-md absolute right-5 bottom-5 left-5 text-balance" lang={nameLang}>
        {name}
      </span>
    </div>
  );
}
