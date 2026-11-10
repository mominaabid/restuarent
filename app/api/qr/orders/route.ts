import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const token = params.get("token")?.trim();
  const orderId = params.get("order_id")?.trim();
  const phone = params.get("phone")?.trim();
  if (!token || !orderId || !phone || !/^\d+$/.test(orderId)) {
    return NextResponse.json({ error: "A QR token, order ID and customer phone are required." }, { status: 400 });
  }
  try {
    const response = await qrBackendFetch(`/api/orders/qr/${encodeURIComponent(token)}/${encodeURIComponent(orderId)}/?phone=${encodeURIComponent(phone)}`);
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "The restaurant service is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  try {
    const response = await qrBackendFetch("/api/orders/qr/", {
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
