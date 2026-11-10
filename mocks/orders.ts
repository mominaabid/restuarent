import type { Order } from "@/types";

// Runtime mock store, mutated by lib/api/orders.ts as orders are placed.
// Resets when the dev server restarts — expected during this mock phase,
// see docs/architecture-plan.md §07.
export const ORDERS: Order[] = [];
