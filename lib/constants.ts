/**
 * FALLBACK ONLY for the name and logo. The live restaurant name/logo come
 * from the backend — see lib/branding.ts getBranding(), which reads whatever
 * is configured in the admin under Settings -> Branding. These values are used
 * when that call fails or a field is left blank, so the site always renders
 * as Farzan rather than an empty title or a generic placeholder.
 */
export const SITE_NAME = "Farzan Pakistani Restaurant";
export const SITE_NAME_AR = "مطعم فرزان الباكستاني";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://smokeandchar.example.com";
export const SITE_DESCRIPTION =
  "Authentic Pakistani food in Al Kharj — karahi, biryani, BBQ and fresh bread, cooked to order.";

/** Bundled with this app (public/brand). Used whenever no logo/favicon URL is configured. */
export const DEFAULT_LOGO_URL = "/brand/farzan-logo.png";
export const DEFAULT_FAVICON_URL = "/brand/favicon.png";

/** Contact details shown in the footer and on the customer's receipt. */
export const RESTAURANT_CONTACT = {
  address: "48X3+7HH, As Sulaymaniyah, Al-Kharj 16278, Saudi Arabia",
  phoneDisplay: "+966 54 106 3790",
  phoneHref: "tel:+966541063790",
  /** wa.me link for the same number; append ?text=... for a prefilled message. */
  whatsappUrl: "https://wa.me/966541063790",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=48X3%2B7HH%2C%20As%20Sulaymaniyah%2C%20Al-Kharj%2016278%2C%20Saudi%20Arabia",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2773.1671287913405!2d47.30140237390759!3d24.14820037339098!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e254f007aae31c7%3A0x8d56677850b0d8ba!2z2YXYt9i52YUg2YHYsdiy2KfZhiBGYXJ6YW4gUGFraXN0YW5pIFJlc3RhdXJhbnQ!5e1!3m2!1sen!2s!4v1791770710835!5m2!1sen!2s",
  hours: "4:30 AM – 12:30 AM",
  /** Opening hours as 24h "HH:MM" in Saudi time, for the open/closed badge and structured data. */
  opensAt: "04:30",
  closesAt: "00:30",
  geo: { latitude: 24.1482, longitude: 47.3014 },
  /** Google Maps place data id (from the embed URL) — used to fetch reviews via SerpAPI. */
  googleDataId: "0x3e254f007aae31c7:0x8d56677850b0d8ba",
  /** Google place id — opens the "write a review" dialog for this restaurant. */
  writeReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJxzGuegBPJT4RutiwUHhnVo0",
};
