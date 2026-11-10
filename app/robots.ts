import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Per-table QR pages and the cart are private/ephemeral — nothing
        // useful for a search index, and t/[tableCode] shouldn't be crawlable
        // even if a stale link leaks. See docs/architecture-plan.md §11.
        disallow: ["/t/", "/cart"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
