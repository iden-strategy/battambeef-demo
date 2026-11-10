import { CutMapTeaser, FeaturedCuts } from "@/components/home/cuts-teaser";
import { Hero } from "@/components/home/hero";
import { Statement } from "@/components/home/statement";
import { MarqueeBand } from "@/components/marquee-band";
import { pageMetadata } from "@/lib/metadata";
import { BusinessTeaser, FarmPreview, KnowledgeTeaser } from "@/components/home/teasers";

export const generateMetadata = () => pageMetadata("home");

/**
 * Home: from Battambang farm to your table. Surfaces: dark (default) throughout, one light
 * breathing section (For Business) and one kraft section (Beef Knowledge).
 */
export default function Page() {
  return (
    <>
      {/* 1. "HOLY COW." depth reveal: melts into the charcoal page */}
      <Hero />
      {/* 2. Statement with inline photos */}
      <Statement />
      {/* 3. Campaign marquee */}
      <MarqueeBand />
      {/* 4. Compact cut map */}
      <CutMapTeaser />
      {/* 5. Featured cuts carousel */}
      <FeaturedCuts />
      {/* 6. Farm to Table preview */}
      <FarmPreview />
      {/* 7. For Business (light) */}
      <BusinessTeaser />
      {/* 8. Beef Knowledge (kraft) */}
      <KnowledgeTeaser />
    </>
  );
}
