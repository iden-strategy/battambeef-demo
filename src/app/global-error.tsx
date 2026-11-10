"use client"; // Error boundaries must be Client Components

import { useSyncExternalStore } from "react";
import messages from "../../messages/global-error.json";

// Last-resort page when the site layout itself fails. It replaces the whole document, so it
// cannot use the site's translations provider, fonts or stylesheet: brand colours inline, system
// fonts, and its own small messages file (messages/global-error.json), so the full message files
// are never part of every page's JavaScript. Keep its English in step with `errors` in
// messages/en.json (an e2e check compares them). Khmer is used on /km pages once the team has
// replaced the TODO-KM markers; until then, English.
type Strings = (typeof messages)["en"];
type Key = keyof Strings;

const isKhmerPath = () => window.location.pathname === "/km" || window.location.pathname.startsWith("/km/");
const noop = () => () => {};

function useStrings(): { text: (key: Key) => string; lang: (key: Key) => "en" | "km" } {
  // The server (and hydration) render English; the browser then checks the address.
  const khmer = useSyncExternalStore(noop, isKhmerPath, () => false);
  const pick = (key: Key) => (khmer && !messages.km[key].includes("TODO-KM") ? "km" : "en");
  return { text: (key) => messages[pick(key)][key], lang: pick };
}

const CHARCOAL = "#292B2D";
const WHITE = "#F5F3EF";
const KRAFT = "#C5A77D";
const CRIMSON = "#7B1E2B";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  console.error(error);
  const { text, lang } = useStrings();
  return (
    <html lang={lang("title")} style={{ colorScheme: "dark" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          background: CHARCOAL,
          color: WHITE,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <title>{`${text("title")} · ${text("siteName")}`}</title>
        <main style={{ padding: "2rem max(1.25rem, 4vw)", maxWidth: "40rem" }}>
          <p style={{ color: KRAFT, fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {text("siteName")} · <span lang={lang("eyebrow")}>{text("eyebrow")}</span>
          </p>
          <h1 lang={lang("title")} style={{ fontSize: "clamp(2rem, 8vw, 3.5rem)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em", margin: "1rem 0" }}>
            {text("title")}
          </h1>
          <p lang={lang("line")} style={{ fontSize: "1.125rem", lineHeight: 1.55, opacity: 0.8 }}>
            {text("line")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "2rem" }}>
            <button
              type="button"
              onClick={() => retry()}
              style={{ minHeight: 44, padding: "0 1.5rem", borderRadius: 999, border: 0, background: CRIMSON, color: WHITE, font: "inherit", fontWeight: 600, cursor: "pointer" }}
            >
              <span lang={lang("retry")}>{text("retry")}</span>
            </button>
            {/* A plain link on purpose: when the root layout has crashed, client-side navigation
                can't be trusted, and a full page load is the reliable way out. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{ minHeight: 44, display: "inline-flex", alignItems: "center", padding: "0 1.5rem", borderRadius: 999, border: `1.5px solid ${WHITE}`, color: WHITE, fontWeight: 600, textDecoration: "none" }}
            >
              <span lang={lang("home")}>{text("home")}</span>
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
