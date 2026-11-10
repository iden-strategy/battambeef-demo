"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChipRow } from "@/components/chip-row";
import { FILTER_PART_EVENT } from "@/components/cut-map/cut-events";
import { selectCowPart } from "@/components/cut-map/cut-selection";
import { CutCard } from "@/components/cuts-grid/cut-card";
import { CutDetail } from "@/components/cuts-grid/cut-detail-lazy";
import { MotionMaxProvider } from "@/components/motion/motion-max-provider";
import { EASE_OUT_EXPO } from "@/components/motion/tokens";
import { useMotionPrefs } from "@/components/motion/use-motion-prefs";
import { Button } from "@/components/ui/button";
import { useFallbackLang } from "@/i18n/use-fallback-lang";
import type { CowPartGeometry, CowPartId } from "@/lib/data/cow-map";
import type { CookingMethod, Cut, CutTier } from "@/lib/data/cuts";

const ALL = "all";
type Filters = { part: CowPartId | typeof ALL; method: CookingMethod | typeof ALL; tier: CutTier | typeof ALL };
const NO_FILTERS: Filters = { part: ALL, method: ALL, tier: ALL };

type CutsGridClientProps = {
  cuts: Cut[];
  parts: CowPartGeometry[];
  methods: CookingMethod[];
  tiers: CutTier[];
};

export function CutsGridClient({ cuts, parts, methods, tiers }: CutsGridClientProps) {
  const t = useTranslations("beefCuts.grid");
  const tp = useTranslations("cutMap.parts");
  const tm = useTranslations("cutOptions.methods");
  const tt = useTranslations("cutOptions.tiers");
  const lang = useFallbackLang();
  const { reduced } = useMotionPrefs();

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const showOnCowRef = useRef<CowPartId | null>(null);

  const scrollTo = useCallback(
    (id: string) => {
      document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    },
    [reduced],
  );

  // "See all [part] cuts" in the map panel: filter to that part and bring the grid into view.
  useEffect(() => {
    const onFilterPart = (e: Event) => {
      setFilters({ ...NO_FILTERS, part: (e as CustomEvent<CowPartId>).detail });
      scrollTo("all-cuts");
      // Keyboard and screen reader users land on the grid heading, not back at the panel button.
      document.getElementById("all-cuts-heading")?.focus({ preventScroll: true });
    };
    window.addEventListener(FILTER_PART_EVENT, onFilterPart);
    return () => window.removeEventListener(FILTER_PART_EVENT, onFilterPart);
  }, [scrollTo]);

  const visible = useMemo(
    () =>
      cuts.filter(
        (c) =>
          (filters.part === ALL || c.part === filters.part) &&
          (filters.method === ALL || c.methods.includes(filters.method)) &&
          (filters.tier === ALL || c.tier === filters.tier),
      ),
    [cuts, filters],
  );

  const partOf = (id: CowPartId) => parts.find((p) => p.id === id)!;
  const openCut = cuts.find((c) => c.id === openId) ?? null;
  const filtered = filters.part !== ALL || filters.method !== ALL || filters.tier !== ALL;

  const allItem = { id: ALL, label: t("all"), lang: lang("beefCuts.grid.all") };
  const partItems = [
    allItem,
    ...parts.map((p) => ({ id: p.id as string, label: tp(p.id), lang: lang(`cutMap.parts.${p.id}`) })),
  ];
  const methodItems = [
    allItem,
    ...methods.map((method) => ({ id: method as string, label: tm(method), lang: lang(`cutOptions.methods.${method}`) })),
  ];
  const tierItems = [
    allItem,
    ...tiers.map((x) => ({ id: x as string, label: tt(x), lang: lang(`cutOptions.tiers.${x}`) })),
  ];

  // After the dialog has gone: focus goes back to the card, or to the map chip for "Show on the cow".
  const onClosed = () => {
    const part = showOnCowRef.current;
    showOnCowRef.current = null;
    if (part) {
      scrollTo("cut-map");
      document.querySelector<HTMLElement>("#cut-map [aria-pressed='true']")?.focus({ preventScroll: true });
    } else if (openId) {
      cardRefs.current.get(openId)?.focus();
    }
  };

  return (
    // Layout animations (card reflow, card → detail photo morph) need Motion's domMax features;
    // the provider loads them as the grid comes near the viewport (cards only animate on filter or open).
    <MotionMaxProvider>
      <div role="group" aria-label={t("filtersLabel")} className="flex flex-col gap-4">
        <FilterGroup label={t("byPart")} lang={lang("beefCuts.grid.byPart")}>
          <ChipRow
            items={partItems}
            value={filters.part}
            onChange={(id) => setFilters((f) => ({ ...f, part: id as Filters["part"] }))}
            label={t("byPart")}
          />
        </FilterGroup>
        <FilterGroup label={t("byMethod")} lang={lang("beefCuts.grid.byMethod")}>
          <ChipRow
            items={methodItems}
            value={filters.method}
            onChange={(id) => setFilters((f) => ({ ...f, method: id as Filters["method"] }))}
            label={t("byMethod")}
          />
        </FilterGroup>
        <FilterGroup label={t("byTier")} lang={lang("beefCuts.grid.byTier")}>
          <ChipRow
            items={tierItems}
            value={filters.tier}
            onChange={(id) => setFilters((f) => ({ ...f, tier: id as Filters["tier"] }))}
            label={t("byTier")}
          />
        </FilterGroup>
      </div>

      <div className="mt-6 flex min-h-11 flex-wrap items-center justify-between gap-3">
        <p role="status" className="body-sm tabular text-muted-foreground" lang={lang("beefCuts.grid.count")}>
          {t("count", { shown: visible.length, total: cuts.length })}
        </p>
        {filtered && (
          <Button variant="link" size="sm" onClick={() => setFilters(NO_FILTERS)} lang={lang("beefCuts.grid.clear")}>
            {t("clear")}
          </Button>
        )}
      </div>

      {visible.length === 0 && (
        <p className="body mt-8 text-muted-foreground" lang={lang("beefCuts.grid.empty")}>
          {t("empty")}
        </p>
      )}

      <ul className="relative mt-2 grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((cut) => (
            <m.li
              key={cut.id}
              layout={!reduced}
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
              transition={reduced ? { duration: 0 } : { duration: 0.4, ease: EASE_OUT_EXPO }}
            >
              <CutCard
                ref={(el) => {
                  if (el) cardRefs.current.set(cut.id, el);
                  else cardRefs.current.delete(cut.id);
                }}
                cut={cut}
                partName={tp(cut.part)}
                imageLayoutId={reduced ? undefined : `cut-image-${cut.id}`}
                onOpen={() => setOpenId(cut.id)}
              />
            </m.li>
          ))}
        </AnimatePresence>
      </ul>

      <AnimatePresence>
        {openCut && (
          <CutDetail
            key={openCut.id}
            cut={openCut}
            part={partOf(openCut.part)}
            partName={tp(openCut.part)}
            totalParts={parts.length}
            tierName={tt(openCut.tier)}
            imageLayoutId={reduced ? undefined : `cut-image-${openCut.id}`}
            reduced={reduced}
            onClose={() => setOpenId(null)}
            onShowOnCow={() => {
              showOnCowRef.current = openCut.part;
              selectCowPart(openCut.part);
              setOpenId(null);
            }}
            onClosed={onClosed}
          />
        )}
      </AnimatePresence>
    </MotionMaxProvider>
  );
}

function FilterGroup({ label, lang, children }: { label: string; lang?: "en"; children: React.ReactNode }) {
  return (
    <div>
      <p className="label mb-1 text-label" lang={lang}>
        {label}
      </p>
      {children}
    </div>
  );
}
