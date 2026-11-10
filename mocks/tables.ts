import type { Table } from "@/types";

// Tables 1–4 are pre-opened for the demo (a real "open table" action lives in
// restaurant-admin's POS, per docs/architecture-plan.md — not built yet).
// Tables 5–6 are left closed to demonstrate the stale/unopened-QR state.
export const TABLES: Table[] = [
  { id: "t1", branchId: "default", label: "Table 1", qrCode: "/t/table-1-demo", sessionToken: "table-1-demo", status: "occupied" },
  { id: "t2", branchId: "default", label: "Table 2", qrCode: "/t/table-2-demo", sessionToken: "table-2-demo", status: "occupied" },
  { id: "t3", branchId: "default", label: "Table 3", qrCode: "/t/table-3-demo", sessionToken: "table-3-demo", status: "occupied" },
  { id: "t4", branchId: "default", label: "Table 4", qrCode: "/t/table-4-demo", sessionToken: "table-4-demo", status: "occupied" },
  { id: "t5", branchId: "default", label: "Table 5", qrCode: "", status: "empty" },
  { id: "t6", branchId: "default", label: "Table 6", qrCode: "", status: "empty" },
];
