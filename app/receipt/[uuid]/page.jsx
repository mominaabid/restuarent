import { notFound } from "next/navigation";
import TaxInvoices from "@/components/billing/TaxInvoice";
import InvoiceActions from "@/components/billing/InvoiceActions";
import { getI18n } from "@/lib/i18n/server";
import { qrBackendFetch } from "@/lib/qrBackend";

/**
 * The page a shared invoice link opens: the customer's simplified tax
 * invoice with its QR, to view, save as PDF or pass on. Never indexed.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata() {
  const { t } = await getI18n();
  return { title: t.invoice.pageTitle, robots: { index: false, follow: false } };
}

async function loadInvoice(uuid) {
  if (!UUID.test(uuid)) return null;
  try {
    const response = await qrBackendFetch(`/api/zatca/public/receipts/${uuid}/`);
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

export default async function ReceiptPage({ params }) {
  const { uuid } = await params;
  const invoice = await loadInvoice(uuid);
  if (!invoice) notFound();
  return (
    <main className="min-h-screen bg-brand-black px-5 py-24">
      <div className="mx-auto w-full max-w-md space-y-6">
        <TaxInvoices invoices={[invoice]} />
        <InvoiceActions invoice={invoice} />
      </div>
    </main>
  );
}
