import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

export async function GET(request: Request) {
  const branch = new URL(request.url).searchParams.get("branch")?.trim();
  if (!branch || !/^\d+$/.test(branch)) return NextResponse.json({ error: "A valid branch is required." }, { status: 400 });
  try {
    const response = await qrBackendFetch(`/api/menu/?branch=${encodeURIComponent(branch)}`);
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "The restaurant menu is unavailable." }, { status: 503 });
  }
}
