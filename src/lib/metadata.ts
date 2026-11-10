import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getOgImage } from "@/lib/data";

export type PageKey = "home" | "about" | "farmToTable" | "beefCuts" | "forBusiness" | "beefKnowledge" | "contact" | "styleguide" | "notFound";

/**
 * Title, description and link preview (Open Graph) for a page, from meta.titles /
 * meta.descriptions. The preview image is a placeholder crop of the hero illustration.
 * Indexing stays blocked by the layout's robots metadata, robots.txt and the X-Robots-Tag header.
 */
export async function pageMetadata(key: PageKey): Promise<Metadata> {
  const t = await getTranslations("meta");
  const locale = await getLocale();
  const title = t(`titles.${key}`);
  const description = t(`descriptions.${key}`);
  const og = getOgImage();
  const image = { url: og.src, width: og.width, height: og.height, alt: t("ogAlt") };
  // The full title is built here: the layout's title template does not reach pages in its own
  // segment (Home, 404), so every page states "<title> · BattamBeef" itself.
  const fullTitle = t("titleTemplate").replace("%s", title);
  return {
    title: { absolute: fullTitle },
    description,
    openGraph: {
      title: fullTitle,
      description,
      siteName: t("siteName"),
      type: "website",
      locale: locale === "km" ? "km_KH" : "en_US",
      images: [image],
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}
