import { NextResponse } from "next/server";
import { getGoogleReviewsWithSource } from "@/lib/api/reviews";

/**
 * Diagnostics for the home page reviews: whether they are live from SerpAPI
 * or the committed snapshot, and why. Never returns the key itself.
 */
export async function GET() {
  const { data, source, error } = await getGoogleReviewsWithSource();
  return NextResponse.json(
    { source, error, keyConfigured: Boolean(process.env.SERPAPI_KEY), count: data.reviews.length, rating: data.rating },
    { headers: { "Cache-Control": "no-store" } },
  );
}
