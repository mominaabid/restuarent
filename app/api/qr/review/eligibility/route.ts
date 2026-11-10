import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

/**
 * Whether the pay screen should offer "Leave a review" for this bill:
 * { can_review, reason }. Same BFF shape as /api/qr/bill — BACKEND_BASE_URL
 * stays server-side.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = params.get("token")?.trim();
  const billId = params.get("bill_id")?.trim() ?? "";
  const phone = params.get("phone")?.trim() ?? "";
  if (!token) return NextResponse.json({ error: "A QR token is required." }, { status: 400 });
  if (!/^\d+$/.test(billId)) return NextResponse.json({ error: "error.billIdInvalid" }, { status: 400 });
  try {
    const query = new URLSearchParams({ session_token: token, phone, bill_id: billId });
    const response = await qrBackendFetch(`/api/reviews/qr/eligibility/?${query}`);
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "The restaurant service is unavailable." }, { status: 503 });
  }
}
