import TableBanner from "@/components/ordering/TableBanner";
import QrOrderTracking from "@/components/ordering/QrOrderTracking";
import { getBackendWebSocketUrl } from "@/lib/qrBackend";

/** "My order" for the scanned table — no order number or phone needed. */
export default async function TableOrderStatusPage({ params, searchParams }) {
  const { tableCode } = await params;
  const query = await searchParams;

  return (
    <main className="min-h-screen bg-brand-black px-4 pb-16 pt-24 sm:px-5 md:px-8 md:pt-32">
      <div className="mx-auto max-w-2xl">
        <TableBanner />
        <QrOrderTracking tableCode={tableCode} initialBillId={query?.bill_id ?? ""} socketBaseUrl={getBackendWebSocketUrl()} />
      </div>
    </main>
  );
}