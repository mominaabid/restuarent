import Link from "next/link";
import TableBanner from "@/components/ordering/TableBanner";
import BillPayClient from "@/components/billing/BillPayClient";
import { getBranding } from "@/lib/branding";
import { getI18n } from "@/lib/i18n/server";

/**
 * The customer's pay screen for a scanned table.
 *
 * The bill is loaded and polled client-side (cashier takes the cash, webhook
 * settles an online payment): each phone has its own bill at a table, and the
 * phone this device ordered with lives in the browser, not on the server.
 *
 * Noindex is inherited from the /t/[tableCode] layout — these are private,
 * per-seating pages.
 */
export default async function TablePayPage({ params, searchParams }) {
  const { tableCode } = await params;
  const query = await searchParams;
  // The branding name goes on the printed receipt so the customer's copy
  // carries the restaurant's own letterhead.
  const [branding, { locale, t }] = await Promise.all([getBranding(), getI18n()]);

  return (
    <main className="min-h-screen bg-brand-black px-4 pb-16 pt-24 sm:px-5 md:px-8 md:pt-32">
      <div className="mx-auto max-w-2xl">
        <TableBanner />
        <p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">{t.pay.kicker}</p>
        <h1 className="mb-4 mt-0.5 font-display text-3xl tracking-wide text-white sm:mb-6 sm:text-4xl">{t.pay.heading}</h1>

        <BillPayClient tableCode={tableCode} initialBill={null} expectedBillId={query?.bill_id} orderNumber={query?.order_number} restaurantName={branding.name} restaurantNameAr={branding.nameAr} />

        <Link
          href={`/t/${encodeURIComponent(tableCode)}/menu`}
          className="mt-8 inline-block font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/50 hover:text-brand-red"
        >
          {t.pay.backToMenu}
        </Link>
      </div>
    </main>
  );
}
