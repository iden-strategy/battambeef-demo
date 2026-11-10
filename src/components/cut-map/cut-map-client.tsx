"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChipRow } from "@/components/chip-row";
import { CutMapSvg, type TextLang } from "@/components/cut-map/cut-map-svg";
import { CutPanel } from "@/components/cut-map/cut-panel";
import {
  DEFAULT_PART,
  getHash,
  getServerHash,
  partFromHash,
  selectCowPart,
  subscribeHash,
} from "@/components/cut-map/cut-selection";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { CowPartGeometry, CowPartId } from "@/lib/data/cow-map";
import type { Cut } from "@/lib/data/cuts";

export type CutMapClientProps = {
  parts: CowPartGeometry[];
  /** Cuts of each part, keyed by part id. */
  cutsByPart: Record<string, Cut[]>;
  silhouette: string;
  image: { src: string; width: number; height: number };
  /** The photo is the page's LCP image: preload it and fetch it at high priority. */
  preload?: boolean;
  /** Compact: panel shows the part name, top two cuts and a link. Does not touch the URL hash. */
  compact?: boolean;
};

export function CutMapClient({ parts, cutsByPart, silhouette, image, preload, compact = false }: CutMapClientProps) {
  const t = useTranslations("cutMap");
  const locale = useLocale();
  const lang = useFallbackLang();
  const rootRef = useRef<HTMLDivElement>(null);
  const ids = useMemo(() => parts.map((p) => p.id), [parts]);

  // Full map: the selection lives in the URL hash. Compact map: plain local state.
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const [local, setLocal] = useState<CowPartId>(DEFAULT_PART);
  const selectedId = compact ? local : (partFromHash(hash, ids) ?? DEFAULT_PART);
  const select = useCallback((id: CowPartId) => (compact ? setLocal(id) : selectCowPart(id)), [compact]);

  // Opening a shared link (#loin): bring the map into view once.
  useEffect(() => {
    if (compact) return;
    if (partFromHash(window.location.hash.slice(1), ids)) {
      rootRef.current?.scrollIntoView({ block: "start" });
    }
  }, [compact, ids]);

  const names = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, t(`parts.${p.id}`)])), [parts, t]);
  // "en" when the Khmer text is still missing and English is shown; "km" for real Khmer text.
  const langs = useMemo(
    () =>
      Object.fromEntries(
        parts.map((p): [string, TextLang] => [
          p.id,
          lang(`cutMap.parts.${p.id}`) ?? (locale === "km" ? "km" : undefined),
        ]),
      ),
    [parts, lang, locale],
  );
  const part = parts.find((p) => p.id === selectedId) ?? parts[0];
  const chips = parts.map((p) => ({
    id: p.id,
    prefix: p.number,
    label: names[p.id],
    lang: lang(`cutMap.parts.${p.id}`),
  }));

  return (
    <div ref={rootRef} className="@container/cutmap scroll-mt-[calc(var(--header-h)+1rem)]">
      <div className="grid gap-6 @5xl/cutmap:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] @5xl/cutmap:items-start @5xl/cutmap:gap-10">
        <div className="min-w-0">
          <CutMapSvg
            parts={parts}
            names={names}
            langs={langs}
            selectedId={selectedId}
            onSelect={select}
            image={image}
            silhouette={silhouette}
            preload={preload}
          />
          <div className="mt-3">
            <ChipRow items={chips} value={selectedId} onChange={select} label={t("chipsLabel")} />
          </div>
        </div>
        <div className="min-w-0">
          <CutPanel
            part={part}
            total={parts.length}
            cuts={cutsByPart[part.id] ?? []}
            compact={compact}
          />
        </div>
      </div>
    </div>
  );
}
