import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

/**
 * Ask to pay: open -> pay_requested, which locks the bill against new orders.
 *
 * The body carries only { session_token, method } — never an amount. For
 * method="online" the backend's response additionally carries the Moyasar
 * publishable key, the callback URL and the amount in halalas, which is why
 * this app needs no Moyasar environment variables at all.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  try {
    const response = await qrBackendFetch("/api/bills/request-pay/", {
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
