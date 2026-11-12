import type { MetadataRoute } from "next";
import { getBrandColor } from "@/lib/data";

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
    background_color: getBrandColor("charcoal"),
    theme_color: getBrandColor("charcoal"),
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
