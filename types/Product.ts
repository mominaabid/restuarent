export interface Category {
  id: string;
  branchId: string;
  name: string;
  sortOrder: number;
}

import type { Weekday } from "@/lib/weekday";
import type { Deal } from "@/lib/deals";

export interface Product {
  id: string;
  branchId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  image: string;
  isAvailable: boolean;
  badge?: "New" | "Popular" | "Deal" | null;
  /** Days this item shows on the menu. Undefined/empty = every day. Set from restaurant-admin's product editor. */
  days?: Weekday[];
  /** Limited-time special price, active only during specific day+time windows. */
  deal?: Deal;
}
