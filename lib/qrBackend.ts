const backendBaseUrl = () => {
  const value = process.env.BACKEND_BASE_URL?.trim() ||
    (process.env.NODE_ENV === "production" ? "https://backendpos.nxgenai.pro" : "http://localhost:8000");
  return value.replace(/\/+$/, "");
};

export function getBackendWebSocketUrl() {
  return backendBaseUrl().replace(/^http/, "ws");
}

export async function qrBackendFetch(path: string, init?: RequestInit) {
  return fetch(`${backendBaseUrl()}${path}`, { ...init, cache: "no-store" });
}

export interface QrTableResponse {
  id: number;
  branch: number;
  label_en: string;
  label_ar: string;
  qr_code: string;
  session_token: string;
  status: "empty" | "occupied" | "needs-bill";
}

export interface QrOrderResponse {
  id: number;
  /** Short readable number (ORD-00000020) — the only order label to display. */
  order_number: string;
  /** Signed lookup value. Never rendered. */
  tracking_token: string;
  table: number;
  bill_id: number | null;
  bill_status: QrBillStatus | null;
  payment_request_cancelled_by_add: boolean;
  source: "qr" | "pos";
  status: string;
  items: Array<{
    id: number;
    name_en_snapshot: string;
    name_ar_snapshot: string;
    variant_name_en_snapshot?: string;
    variant_name_ar_snapshot?: string;
    price_snapshot: string;
    quantity: number;
    status: string;
    is_new?: boolean;
    is_additional_batch?: boolean;
    notes: string;
  }>;
  total: string;
  opened_at: string;
  closed_at: string | null;
}

export interface QrSessionResponse {
  table: QrTableResponse;
  bill_id: number | null;
  open_order: QrOrderResponse | null;
}

export async function getQrSession(token: string): Promise<QrSessionResponse | null> {
  try {
    const response = await qrBackendFetch(`/api/tables/by-session/${encodeURIComponent(token)}/`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    return (await response.json()) as QrSessionResponse;
  } catch (error) {
    console.error("Could not resolve QR table session:", error);
    return null;
  }
}

export async function getQrOrder(token: string, orderId: string, phone: string): Promise<QrOrderResponse | null> {
  try {
    const response = await qrBackendFetch(`/api/orders/qr/${encodeURIComponent(token)}/${encodeURIComponent(orderId)}/?phone=${encodeURIComponent(phone)}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    return (await response.json()) as QrOrderResponse;
  } catch (error) {
    console.error("Could not resolve exact QR order:", error);
    return null;
  }
}

export function toQrWebOrder(row: QrOrderResponse) {
  return {
    id: String(row.id),
    orderNumber: row.order_number,
    tableId: String(row.table),
    billId: row.bill_id == null ? undefined : String(row.bill_id),
    source: row.source,
    status: row.status,
    items: row.items.map((item) => ({
      id: String(item.id),
      nameSnapshot: item.name_en_snapshot,
      variantNameSnapshot: item.variant_name_en_snapshot || item.variant_name_ar_snapshot || "",
      priceSnapshot: Number(item.price_snapshot),
      quantity: item.quantity,
      status: item.status,
      isNew: item.is_new ?? false,
      notes: item.notes,
    })),
    total: Number(row.total),
    openedAt: row.opened_at,
    closedAt: row.closed_at ?? undefined,
  };
}

/**
 * Billing (Phase 14 — Moyasar). Every amount here is computed by the backend
 * from the database; nothing in this file ever sends an amount up. The
 * publishable key and callback URL also come from the backend, so this app
 * holds no Moyasar configuration of its own and switching test -> live is a
 * backend .env change with no deploy here.
 */

export type QrBillStatus = "open" | "pay_requested" | "paid" | "closed";
export type QrBillMethod = "cash" | "card" | "online" | "";

export interface QrBillOrder {
  id: number;
  order_number: string;
  status: string;
  opened_at: string;
  total: string;
  items: Array<{
    id: number;
    name_en: string;
    name_ar: string;
    /** The portion as ordered, frozen at order time. Empty for single-price items. */
    variant_name_en?: string;
    variant_name_ar?: string;
    price: string;
    quantity: number;
    status: string;
    notes: string;
    /** True for lines added after the order's first batch ("Added later"). */
    is_additional_batch?: boolean;
  }>;
}

export interface QrBillResponse {
  id: number;
  bill_code: string;
  table: number | null;
  table_label: string | null;
  status: QrBillStatus;
  requested_method: QrBillMethod;
  paid_method: QrBillMethod;
  /** Decimal string, e.g. "51.00". Display only — never sent back. */
  total: string;
  /** Current outstanding balance in halalas, as required by the payment form. */
  total_halalas: number;
  amount_paid: string;
  amount_outstanding: string;
  currency: string;
  ready_to_pay: boolean;
  payment_request_cancelled_by_add: boolean;
  unserved_order_ids: number[];
  needs_review: boolean;
  orders: QrBillOrder[];
  pay_requested_at: string | null;
  paid_at: string | null;
  closed_at: string | null;
}

/** Extra fields the backend adds to a request-pay response when method=online. */
export interface QrOnlinePayResponse extends QrBillResponse {
  publishable_key: string;
  callback_url: string;
  description: string;
}

/** Null when there is no bill, or when `billId` (the pinned bill) has ended (409 billSessionEnded). */
export async function getQrBill(token: string, billId?: string): Promise<QrBillResponse | null> {
  try {
    const query = billId && /^\d+$/.test(billId) ? `?bill_id=${encodeURIComponent(billId)}` : "";
    const response = await qrBackendFetch(`/api/bills/by-session/${encodeURIComponent(token)}/${query}`);
    if (response.status === 404 || response.status === 409) return null;
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    return (await response.json()) as QrBillResponse;
  } catch (error) {
    console.error("Could not load the table bill:", error);
    return null;
  }
}
