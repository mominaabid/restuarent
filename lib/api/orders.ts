import type { Order, OrderItem } from "@/types";
import type { CartItem } from "@/context/CartContext";
import { ORDERS } from "@/mocks/orders";

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface CreateOrderInput {
  branchId?: string;
  tableId: string;
  customerId: string;
  items: CartItem[];
}

export async function createOrder({ branchId = "default", tableId, customerId, items }: CreateOrderInput): Promise<Order> {
  const orderItems: OrderItem[] = items.map((item) => ({
    id: generateId("item"),
    productId: String(item.productId ?? item.id),
    nameSnapshot: item.name,
    priceSnapshot: item.price,
    quantity: item.quantity,
    status: "fired",
  }));

  const order: Order = {
    id: generateId("order"),
    branchId,
    tableId,
    customerId,
    source: "qr",
    items: orderItems,
    status: "sent",
    payments: [],
    openedAt: new Date().toISOString(),
  };
  ORDERS.push(order);
  return order;
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  return ORDERS.find((order) => order.id === id);
}
