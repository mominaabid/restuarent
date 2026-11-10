import { cache } from "react";
import type { Table } from "@/types";
import { TABLES } from "@/mocks/tables";
import { getQrSession } from "@/lib/qrBackend";

export async function getTables(): Promise<Table[]> {
  return TABLES;
}

/**
 * The QR code encodes this token, not the raw table id — a stale photo of an
 * old QR code (or last week's receipt) stops resolving once the table closes
 * out and its token clears. See docs/architecture-plan.md §11.
 */
// cache(): the /t/[tableCode] layout and the page both ask for the table on
// every render; within one server request this makes it a single backend call.
export const getTableBySessionToken = cache(async (tableCode: string): Promise<Table | undefined> => {
  const session = await getQrSession(tableCode);
  if (!session) return undefined;
  const { table } = session;
  return {
    id: String(table.id),
    branchId: String(table.branch),
    label: table.label_en || table.label_ar || `Table ${table.id}`,
    qrCode: table.qr_code,
    sessionToken: table.session_token,
    status: table.status,
  };
});
