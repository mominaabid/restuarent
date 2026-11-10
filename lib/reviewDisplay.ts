import type { GoogleReview } from "@/lib/api/reviews";
import type { Locale } from "@/lib/i18n/config";
import { formatRelativeDate } from "@/lib/format";

/** Arabic visitors see the review as written; English visitors see Google's English text. */
export function reviewText(review: GoogleReview, locale: Locale): string {
  return locale === "ar" ? review.originalText || review.text : review.text;
}

/** "3 months ago" / "قبل 3 أشهر", falling back to Google's English phrase. */
export function reviewDate(review: GoogleReview, locale: Locale): string {
  return formatRelativeDate(review.isoDate, locale) || review.relativeTime;
}
