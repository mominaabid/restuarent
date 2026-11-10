import TableBanner from "@/components/ordering/TableBanner";
import QrOrderTracking from "@/components/ordering/QrOrderTracking";
import { getBackendWebSocketUrl } from "@/lib/qrBackend";

/**
 * Live order page for a scanned table. The path segment is only the order
 * number to highlight; the page itself loads through the table session token,
 * with the pinned bill id from ?bill_id= (or this tab's stored pin).
 */
export default async function OrderTrackingPage({ params, searchParams }) {
  const { tableCode, orderId } = await params;
  const query = await searchParams;

  return (
    <main className="min-h-screen bg-brand-black px-4 pb-16 pt-24 sm:px-5 md:px-8 md:pt-32">
      <div className="mx-auto max-w-2xl">
        <TableBanner />
        <QrOrderTracking tableCode={tableCode} orderNumber={decodeURIComponent(orderId ?? "")} initialBillId={query?.bill_id ?? ""} socketBaseUrl={getBackendWebSocketUrl()} />
      </div>
    </main>
  );
}