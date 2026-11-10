import { CutsGridClient } from "@/components/cuts-grid/cuts-grid-client";
import { getCookingMethods, getCowMap, getCuts, getCutTiers } from "@/lib/data";

/** Filters + grid + detail dialog for every cut. Server component: data comes through the getters. */
export function CutsGrid() {
  return (
    <CutsGridClient
      cuts={getCuts()}
      parts={getCowMap().parts}
      methods={getCookingMethods()}
      tiers={getCutTiers()}
    />
  );
}
