import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

export async function POST(request: Request) {
  try {
    const response = await qrBackendFetch("/api/orders/customer/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    });
    return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
  } catch {
    return NextResponse.json({ error: "The restaurant service is unavailable." }, { status: 503 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const response = await qrBackendFetch(`/api/orders/track/?${url.searchParams.toString()}`);
    return NextResponse.json(await response.json().catch(() => ({})), { status: response.status });
  } catch {
    return NextResponse.json({ error: "The restaurant service is unavailable." }, { status: 503 });
  }
}
