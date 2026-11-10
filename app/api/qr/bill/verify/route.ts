import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

/**
 * Hand a Moyasar payment id to the backend for verification.
 *
 * The callback page sends ONLY the id (plus the table token). It deliberately
 * does not forward Moyasar's ?status= — the backend re-fetches the payment
 * from the Moyasar API and decides for itself, so a customer editing the
 * redirect URL changes nothing.
 *
 * This is a best-effort fast path for the customer's screen. If it fails, the
 * Moyasar webhook settles the bill server-to-server regardless.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  try {
    const response = await qrBackendFetch("/api/bills/verify-online/", {
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
