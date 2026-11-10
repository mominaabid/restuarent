"use server";

import { redirect } from "next/navigation";
import { submitQrOrder } from "@/lib/submitQrOrder";
import type { CartItem } from "@/context/CartContext";

export async function submitOrder(tableCode: string, phone: string, items: CartItem[]) {
  const result = await submitQrOrder({ tableCode, phone, items });
  if ("error" in result) return result;

  redirect(`/t/${tableCode}/order/${result.order.id}`);
}
