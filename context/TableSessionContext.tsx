"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Table } from "@/types";
import { useCart } from "@/context/CartContext";

interface TableSessionValue {
  tableCode: string;
  table: Table;
}

const TableSessionContext = createContext<TableSessionValue | null>(null);

export function TableSessionProvider({
  tableCode,
  table,
  children,
}: {
  tableCode: string;
  table: Table;
  children: ReactNode;
}) {
  const { setActiveTable } = useCart();
  // Once per table, not on every render: after the table is released the
  // cart forgets it (clearActiveTable) and must not be put straight back.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- setActiveTable is recreated each render
  useEffect(() => setActiveTable(tableCode), [tableCode]);
  return <TableSessionContext.Provider value={{ tableCode, table }}>{children}</TableSessionContext.Provider>;
}

export function useTableSession() {
  const context = useContext(TableSessionContext);
  if (!context) throw new Error("useTableSession must be used inside TableSessionProvider");
  return context;
}
