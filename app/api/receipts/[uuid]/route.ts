import { NextResponse } from "next/server";
import { qrBackendFetch } from "@/lib/qrBackend";

/**
 * A customer's own simplified tax invoice by its UUID, for the share link.
 * Same BFF shape as /api/qr/*: BACKEND_BASE_URL stays server-side. The
 * backend never returns a standard (company) invoice here.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  if (!UUID.test(uuid)) return NextResponse.json({ error: "error.notFound" }, { status: 404 });
  try {
    const response = await qrBackendFetch(`/api/zatca/public/receipts/${uuid}/`);
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: "The restaurant service is unavailable." }, { status: 503 });
  }
}
