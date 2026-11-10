import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "A QR token is required." }, { status: 400 });
  try {
    const phone = new URL(request.url).searchParams.get("phone")?.trim() || "";
    const query = new URLSearchParams({ phone });
    const response = await qrBackendFetch(`/api/tables/by-session/${encodeURIComponent(token)}/?${query}`);
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "The restaurant service is unavailable." }, { status: 503 });
  }
}
