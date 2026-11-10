import { RESTAURANT_CONTACT, SITE_NAME, SITE_NAME_AR, SITE_URL } from "@/lib/constants";
import type { GoogleReviews } from "@/lib/api/reviews";

/**
 * schema.org Restaurant data for search engines (rich results, the local
 * business panel). Only facts this site already shows — address, phone,
 * hours, the Google rating — so nothing here can drift from the page.
 */
export function restaurantJsonLd(reviews?: GoogleReviews) {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: SITE_NAME,
    alternateName: SITE_NAME_AR,
    url: SITE_URL,
    image: `${SITE_URL}/hero/farzan-hero.png`,
    logo: `${SITE_URL}/brand/farzan-logo.png`,
    telephone: RESTAURANT_CONTACT.phoneHref.replace("tel:", ""),
    servesCuisine: ["Pakistani"],
    hasMenu: `${SITE_URL}/menu`,
    acceptsReservations: false,
    address: {
      "@type": "PostalAddress",
      streetAddress: "48X3+7HH, As Sulaymaniyah",
      addressLocality: "Al-Kharj",
      postalCode: "16278",
      addressCountry: "SA",
    },
    geo: { "@type": "GeoCoordinates", ...RESTAURANT_CONTACT.geo },
    hasMap: RESTAURANT_CONTACT.mapsUrl,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: RESTAURANT_CONTACT.opensAt,
        closes: RESTAURANT_CONTACT.closesAt,
      },
    ],
    ...(reviews?.rating && reviews.totalCount
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.rating, reviewCount: reviews.totalCount, bestRating: 5 } }
      : {}),
  };
}

/** Renders JSON-LD safely: "<" is escaped so no string can close the script tag. */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
