import { CutMapClient } from "@/components/cut-map/cut-map-client";
import { getCowMap, getCutsByPart } from "@/lib/data";

/**
 * The interactive cut map. Server component: it reads the data through the getters and hands
 * plain props to the client component, which owns selection and interaction.
 */
export function CutMap({ compact = false, preload = false }: { compact?: boolean; preload?: boolean }) {
  const { image, silhouette, parts } = getCowMap();
  const cutsByPart = Object.fromEntries(parts.map((p) => [p.id, getCutsByPart(p.id)]));

  return (
    <CutMapClient
      parts={parts}
      cutsByPart={cutsByPart}
      silhouette={silhouette}
      image={image}
      compact={compact}
      preload={preload}
    />
  );
}
