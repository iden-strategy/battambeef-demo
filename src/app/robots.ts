import type { MetadataRoute } from "next";

// Demo phase: block all crawlers.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
