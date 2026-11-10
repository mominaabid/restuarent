import { unstable_cache } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { RESTAURANT_CONTACT } from "@/lib/constants";
import { qrBackendFetch } from "@/lib/qrBackend";
import snapshot from "@/lib/data/google-reviews-snapshot.json";

/**
 * Live Google Maps reviews for the restaurant, via SerpAPI's
 * google_maps_reviews engine. Server-side only — the key never reaches the
 * browser.
 *
 * Env:
 *   SERPAPI_KEY  live reviews; without it (or when SerpAPI fails) the
 *                committed snapshot in lib/data/ is shown instead
 *
 * Each refresh costs 2 SerpAPI searches (first page + one more page), and the
 * result is cached for 12 hours, so ~120 searches/month per server.
 */

export interface GoogleReview {
  id: string;
  authorName: string;
  authorUrl?: string;
  authorPhotoUrl?: string;
  rating: number;
  /** English text (Google's translation when the review was written in another language). */
  text: string;
  /** The review as the guest wrote it, when it differs from `text`. */
  originalText?: string;
  /** "a month ago" in English, from Google. Prefer isoDate, which can be shown in any language. */
  relativeTime: string;
  isoDate?: string;
  /** Photos the guest attached to the review. */
  images?: string[];
  reviewUrl?: string;
  /**
   * Where the review came from. Absent means Google. "guest" was left from a
   * table's QR pay screen and "localGuide" was added by the restaurant; both
   * are approved in restaurant-admin before they appear here.
   */
  origin?: "google" | "guest" | "localGuide";
}

export interface GoogleReviews {
  rating?: number;
  totalCount?: number;
  placeUrl?: string;
  reviews: GoogleReview[];
}

const SERPAPI_URL = "https://serpapi.com/search.json";
const EXTRA_PAGE_SIZE = 10;

interface SerpReview {
  review_id: string;
  link?: string;
  rating?: number;
  date?: string;
  iso_date?: string;
  images?: string[];
  snippet?: string;
  extracted_snippet?: { original?: string; translated?: string };
  user?: { name?: string; link?: string; thumbnail?: string };
}

interface SerpResponse {
  error?: string;
  place_info?: { rating?: number; reviews?: number };
  reviews?: SerpReview[];
  serpapi_pagination?: { next_page_token?: string };
}

async function serpFetch(apiKey: string, extra: Record<string, string> = {}): Promise<SerpResponse> {
  const params = new URLSearchParams({
    engine: "google_maps_reviews",
    data_id: RESTAURANT_CONTACT.googleDataId,
    hl: "en",
    api_key: apiKey,
    ...extra,
  });
  const res = await fetch(`${SERPAPI_URL}?${params}`, { cache: "no-store" });
  const data: SerpResponse = await res.json();
  if (!res.ok || data.error) throw new Error(`SerpAPI failed: ${res.status} ${data.error ?? ""}`);
  return data;
}

function toReview(r: SerpReview): GoogleReview {
  const text = r.extracted_snippet?.translated ?? r.snippet ?? r.extracted_snippet?.original ?? "";
  const original = r.extracted_snippet?.original;
  return {
    id: r.review_id,
    authorName: r.user?.name ?? "Google user",
    authorUrl: r.user?.link,
    authorPhotoUrl: r.user?.thumbnail,
    rating: r.rating ?? 0,
    text,
    ...(original && original !== text ? { originalText: original } : {}),
    relativeTime: r.date ?? "",
    isoDate: r.iso_date,
    images: r.images ?? [],
    reviewUrl: r.link,
  };
}

async function fetchGoogleReviews(apiKey: string): Promise<GoogleReviews> {
  const first = await serpFetch(apiKey);
  let raw = first.reviews ?? [];

  const token = first.serpapi_pagination?.next_page_token;
  if (token) {
    try {
      const next = await serpFetch(apiKey, { next_page_token: token, num: String(EXTRA_PAGE_SIZE) });
      raw = raw.concat(next.reviews ?? []);
    } catch (error) {
      // The first page is enough to render; don't lose it over the extra page.
      console.error("[reviews] Could not load second page of reviews:", error);
    }
  }

  const reviews = raw.map(toReview).filter((r) => r.text);
  // Throwing keeps an empty result out of the cache, so the next request retries.
  if (!reviews.length) throw new Error("SerpAPI returned no reviews");

  return {
    rating: first.place_info?.rating,
    totalCount: first.place_info?.reviews,
    placeUrl: RESTAURANT_CONTACT.mapsUrl,
    reviews,
  };
}

const getCachedGoogleReviews = unstable_cache(fetchGoogleReviews, ["google-reviews-serpapi-v3"], { revalidate: 43200 });

/** Last-known reviews, committed so the section never disappears in production. */
const SNAPSHOT: GoogleReviews = { ...(snapshot as GoogleReviews), placeUrl: RESTAURANT_CONTACT.mapsUrl };

export async function getGoogleReviewsWithSource(): Promise<{ data: GoogleReviews; source: "live" | "snapshot"; error?: string }> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.warn("[reviews] SERPAPI_KEY is not set — showing the review snapshot.");
    return { data: SNAPSHOT, source: "snapshot", error: "SERPAPI_KEY is not set" };
  }
  try {
    return { data: await getCachedGoogleReviews(apiKey), source: "live" };
  } catch (error) {
    console.error("[reviews] Could not load Google reviews — showing the review snapshot:", error);
    return { data: SNAPSHOT, source: "snapshot", error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getGoogleReviews(): Promise<GoogleReviews> {
  return (await getGoogleReviewsWithSource()).data;
}

// -- the restaurant's own reviews --------------------------------------------

interface SiteReviewRow {
  id: number;
  name: string;
  rating: number;
  comment: string;
  source: "guest" | "admin";
  posted_at: string;
}

/**
 * Approved reviews from restaurant-backend (GET /api/reviews/public/): guest
 * reviews left from the QR pay screen, and "Local Guide" reviews the admin
 * added. Not cached, like the menu (lib/api/products.ts): an approval or an
 * "Unpublish" in the admin shows on the next page view.
 */
export async function getSiteReviews(): Promise<GoogleReview[]> {
  try {
    const response = await qrBackendFetch("/api/reviews/public/");
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    const body: { reviews?: SiteReviewRow[] } = await response.json();
    return (body.reviews ?? []).map((row) => ({
      id: `site-${row.id}`,
      authorName: row.name,
      rating: row.rating,
      text: row.comment ?? "",
      relativeTime: "",
      isoDate: row.posted_at,
      origin: row.source === "admin" ? "localGuide" : "guest",
    }));
  } catch (error) {
    unstable_rethrow(error);
    // The Google reviews still render; the restaurant's own just sit this one out.
    console.error("[reviews] Could not load the restaurant's own reviews:", error);
    return [];
  }
}

/**
 * Google reviews and the restaurant's approved reviews, mixed newest first.
 * The headline rating and count stay Google's own figures.
 */
export async function getAllReviews(): Promise<GoogleReviews> {
  const [google, site] = await Promise.all([getGoogleReviews(), getSiteReviews()]);
  const time = (review: GoogleReview) => (review.isoDate ? Date.parse(review.isoDate) || 0 : 0);
  const reviews = [...site, ...google.reviews].sort((a, b) => time(b) - time(a));
  return { ...google, reviews };
}
