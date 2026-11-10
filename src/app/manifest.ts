import type { MetadataRoute } from "next";

/**
 * Minimal web app manifest: name, colours and the logo icons (public/brand). No start-up or
 * offline behaviour; this phase is a preview site only.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BattamBeef",
    short_name: "BattamBeef",
    start_url: "/",
    display: "browser",
    background_color: "#292B2D",
    theme_color: "#292B2D",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
