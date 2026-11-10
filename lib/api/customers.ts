import type { Customer } from "@/types";
import { CUSTOMERS } from "@/mocks/customers";

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Look up a customer by phone, or create one. Guest-only ordering has no
 * login — phone is the identifier, not a credential. See §01/§06.
 */
export async function findOrCreateCustomerByPhone(phone: string, branchId = "default"): Promise<Customer> {
  const existing = CUSTOMERS.find((customer) => customer.branchId === branchId && customer.phone === phone);
  if (existing) {
    existing.lastOrderAt = new Date().toISOString();
    return existing;
  }

  const customer: Customer = {
    id: generateId("cust"),
    branchId,
    phone,
    createdAt: new Date().toISOString(),
    lastOrderAt: new Date().toISOString(),
  };
  CUSTOMERS.push(customer);
  return customer;
}
