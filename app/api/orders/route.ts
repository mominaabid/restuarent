import { NextResponse } from "next/server";
import { submitQrOrder } from "@/lib/submitQrOrder";
import type { CartItem } from "@/context/CartContext";

interface OrderRequestBody {
  tableCode: string;
  phone: string;
  items: CartItem[];
}

function isValidBody(value: unknown): value is OrderRequestBody {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return typeof body.tableCode === "string" && typeof body.phone === "string" && Array.isArray(body.items);
}

/**
 * The real integration point for a third client (restaurant-mobile) that
 * can't use restaurant-website's Server Actions directly — see
 * docs/architecture-plan.md §05's note that a future mobile app would talk
 * to "whatever API exists." This is that API: same validated submitQrOrder
 * path the website's own cart form uses.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await submitQrOrder(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ orderId: result.order.id, status: result.order.status });
}
