import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

/**
 * The caller's own bill at a scanned table, with a server-computed total.
 *
 * Same BFF shape as the sibling /api/qr/* handlers: the browser talks to this
 * origin only, and BACKEND_BASE_URL stays server-side. Polled by the order and
 * pay screens, so it must stay cheap — qrBackendFetch already sets no-store.
 *
 * `phone` picks the bill (each phone has its own at a table). `bill_id` is the
 * bill this device pinned; the backend answers 409 error.billSessionEnded
 * (passed through) once that bill is released or is not this phone's.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = params.get("token")?.trim();
  const billId = params.get("bill_id")?.trim();
  const phone = params.get("phone")?.trim() ?? "";
  if (!token) return NextResponse.json({ error: "A QR token is required." }, { status: 400 });
  if (billId && !/^\d+$/.test(billId)) return NextResponse.json({ error: "error.billIdInvalid" }, { status: 400 });
  try {
    const query = new URLSearchParams({ phone });
    if (billId) query.set("bill_id", billId);
    const response = await qrBackendFetch(`/api/bills/by-session/${encodeURIComponent(token)}/?${query}`);
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "The restaurant service is unavailable." }, { status: 503 });
  }
}
