import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

/**
 * Leave a review for a settled bill: { session_token, phone, bill_id, name,
 * rating, comment? }. The backend checks the bill is this phone's, paid, and
 * fully served, allows one review per bill, and saves it as pending until
 * an admin approves it in restaurant-admin.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  try {
    const response = await qrBackendFetch("/api/reviews/qr/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "The restaurant service is unavailable." }, { status: 503 });
  }
}
