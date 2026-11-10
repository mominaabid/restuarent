import type { Customer } from "@/types";

// Runtime mock store, mutated by lib/api/customers.ts as QR orders come in.
// Resets when the dev server restarts — expected during this mock phase,
// see docs/architecture-plan.md §07.
export const CUSTOMERS: Customer[] = [];
