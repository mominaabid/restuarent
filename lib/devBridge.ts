/**
 * DEV-ONLY DEMO HACK — not real architecture.
 *
 * restaurant-website and restaurant-admin are two independent projects with
 * no shared backend (see docs/architecture-plan.md §05/§08) — a QR order
 * placed here has no way to reach POS/KDS. This file exists purely so a
 * local demo can *look* connected: it writes each QR order straight into
 * restaurant-admin's public/ folder on disk (same machine, sibling repo),
 * which restaurant-admin then polls from its own origin (no CORS needed).
 *
 * This is not a real integration. There's no auth, no retry, no queue, and
 * it silently does nothing if the sibling repo isn't where expected — it
 * must never throw and break an actual checkout. Delete this file (and its
 * admin-side counterpart, hooks/useQrBridgeSync.ts) once a real backend
 * exists.
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Order } from "@/types";

const BRIDGE_PATH = path.join(process.cwd(), "..", "restaurant-admin", "public", "qr-bridge.json");

type BridgeOrder = Order & { customerPhone: string };

// customerPhone rides along separately because admin has its own, independent
// Customer records (§05) — it looks the phone up/creates its own customer
// rather than trusting this project's customerId.
export async function appendOrderToBridge(order: Order, customerPhone: string): Promise<void> {
  if (process.env.NODE_ENV === "production") return;

  try {
    let existing: BridgeOrder[] = [];
    try {
      existing = JSON.parse(await readFile(BRIDGE_PATH, "utf-8"));
    } catch {
      existing = [];
    }

    existing.push({ ...order, customerPhone });
    await mkdir(path.dirname(BRIDGE_PATH), { recursive: true });
    await writeFile(BRIDGE_PATH, JSON.stringify(existing, null, 2));
  } catch (error) {
    // Best-effort only — never let the demo bridge break a real checkout.
    console.warn("[dev-bridge] could not write qr-bridge.json:", error);
  }
}
