/** An identifier, not an account — no password or session. */
export interface Customer {
  id: string;
  branchId: string;
  /** Unique per branch, the primary lookup key. */
  phone: string;
  name?: string;
  createdAt: string;
  lastOrderAt?: string;
}
