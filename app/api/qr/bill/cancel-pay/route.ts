import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

/**
 * pay_requested -> open, so the table can order again after tapping Pay by
 * mistake. The backend refuses this once the bill is paid.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  try {
    const response = await qrBackendFetch("/api/bills/cancel-pay-request/", {
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
