"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CutDetailProps } from "@/components/cuts-grid/cut-detail";
import { Button } from "@/components/ui/button";
import { useFallbackLang } from "@/i18n/use-fallback-lang";

// The cut detail dialog (Radix Dialog: focus trap, scroll lock, portal) is its own chunk, not
// part of the Beef Cuts page's start-up JavaScript. Cards call preloadCutDetail() on the first
// sign of intent (hover, focus, press), so it is normally loaded before the click lands.
// A failed load is handled here (loading note, one automatic retry, then "Try again"); it never
// throws during render, so it can never reach the page's error boundary.

type DetailModule = typeof import("@/components/cuts-grid/cut-detail");

/** Show the loading note only if loading takes longer than this (no flash on a quick load). */
const SHOW_LOADING_AFTER = 300;
/** Pause before the one automatic retry. */
const RETRY_AFTER = 800;

let loaded: DetailModule | null = null;
let pending: Promise<DetailModule> | null = null;

/** Loads the chunk once; a failed attempt is forgotten, so the next call tries again. */
function load(): Promise<DetailModule> {
  if (loaded) return Promise.resolve(loaded);
  pending ??= import("@/components/cuts-grid/cut-detail").then(
    (mod) => (loaded = mod),
    (error: unknown) => {
      pending = null;
      throw error;
    },
  );
  return pending;
}

async function loadWithRetry() {
  try {
    return await load();
  } catch {
    await new Promise((resolve) => setTimeout(resolve, RETRY_AFTER));
    return load();
  }
}

export const preloadCutDetail = () => {
  load().catch(() => {}); // a failed preload is retried when the card is opened
};

type Status = "waiting" | "loading" | "error";

/**
 * The cut detail dialog, loaded on demand. Until it is ready: nothing for the first 300ms, then a
 * small "Loading" note. If loading fails twice: a note with "Try again" and "Close".
 */
export function CutDetail(props: CutDetailProps) {
  const t = useTranslations("beefCuts.detail");
  const lang = useFallbackLang();
  const [mod, setMod] = useState<DetailModule | null>(loaded);
  const [status, setStatus] = useState<Status>("waiting");
  const [attempt, setAttempt] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (mod) return;
    let live = true;
    const slow = window.setTimeout(() => {
      if (live) setStatus((s) => (s === "waiting" ? "loading" : s));
    }, SHOW_LOADING_AFTER);
    loadWithRetry().then(
      (m) => {
        if (live) setMod(m);
      },
      () => {
        if (live) setStatus("error");
      },
    );
    return () => {
      live = false;
      window.clearTimeout(slow);
    };
  }, [mod, attempt]);

  // The error note takes focus so keyboard and screen reader users can act on it.
  useEffect(() => {
    if (status === "error") retryButton.current?.focus();
  }, [status]);

  if (mod) {
    const Detail = mod.CutDetail;
    return <Detail {...props} />;
  }
  if (status === "waiting") return null;

  const close = () => {
    props.onClosed(); // focus back to the card first (the card still knows it is the open one)
    props.onClose();
  };
  const retry = () => {
    panel.current?.focus(); // keep focus in the note while its buttons are replaced
    setStatus("loading");
    setAttempt((a) => a + 1);
  };

  // Portalled to <body>: the grid's section uses content-visibility (layout containment), which
  // would make it, not the screen, the box a `fixed` note is positioned in.
  return createPortal(
    <div
      ref={panel}
      tabIndex={-1}
      data-surface="dark"
      data-cut-detail-status={status}
      onKeyDown={(e) => e.key === "Escape" && close()}
      className="fixed inset-x-3 bottom-[calc(var(--bottom-bar-h)+env(safe-area-inset-bottom)+0.75rem)] z-[90] mx-auto max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl outline-none md:bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      {status === "loading" ? (
        <p role="status" className="body flex items-center gap-3" lang={lang("beefCuts.detail.loading")}>
          <LoaderCircle aria-hidden className="size-5 shrink-0 text-label motion-safe:animate-spin" />
          {t("loading")}
        </p>
      ) : (
        <div role="alert">
          <p className="body" lang={lang("beefCuts.detail.loadError")}>
            {t("loadError")}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button ref={retryButton} size="sm" onClick={retry} lang={lang("beefCuts.detail.retry")}>
              {t("retry")}
            </Button>
            <Button variant="outline" size="sm" onClick={close} lang={lang("beefCuts.detail.close")}>
              {t("close")}
            </Button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
