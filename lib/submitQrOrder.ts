import { getTableBySessionToken } from "@/lib/api/tables";
import { findOrCreateCustomerByPhone } from "@/lib/api/customers";
import { createOrder } from "@/lib/api/orders";
import { appendOrderToBridge } from "@/lib/devBridge";
import type { CartItem } from "@/context/CartContext";
import type { Order } from "@/types";

export interface SubmitQrOrderInput {
  tableCode: string;
  phone: string;
  items: CartItem[];
}

export type SubmitQrOrderResult = { order: Order } | { error: string };

/**
 * Shared by the website's own cart Server Action (app/t/[tableCode]/cart/actions.ts)
 * and the public API route (app/api/orders/route.ts) that restaurant-mobile calls —
 * one validated path in, whichever client is asking.
 */
export async function submitQrOrder({ tableCode, phone, items }: SubmitQrOrderInput): Promise<SubmitQrOrderResult> {
  const table = await getTableBySessionToken(tableCode);
  if (!table) {
    return { error: "This table session is no longer active. Ask a staff member to rescan." };
  }

  const trimmedPhone = phone.trim();
  if (trimmedPhone.length < 7) {
    return { error: "Enter a valid phone number." };
  }

  if (!items.length) {
    return { error: "Your cart is empty." };
  }

  const customer = await findOrCreateCustomerByPhone(trimmedPhone, table.branchId);
  const order = await createOrder({
    branchId: table.branchId,
    tableId: table.id,
    customerId: customer.id,
    items,
  });

  await appendOrderToBridge(order, trimmedPhone);

  return { order };
}
