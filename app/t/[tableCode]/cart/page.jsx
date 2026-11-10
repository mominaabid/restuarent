import TableBanner from "@/components/ordering/TableBanner";
import QrCartClient from "@/components/ordering/QrCartClient";
import { getI18n } from "@/lib/i18n/server";

export default async function TableCartPage({ params }) {
  const { tableCode } = await params;
  const { t } = await getI18n();

  return (
    <main className="min-h-screen bg-brand-black px-4 pb-16 pt-24 sm:px-5 md:px-8 md:pt-32">
      <div className="mx-auto max-w-2xl">
        <TableBanner />
        <p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">{t.qrCart.kicker}</p>
        <h1 className="mb-4 mt-0.5 font-display text-3xl tracking-wide text-white sm:mb-6 sm:text-4xl">{t.qrCart.heading}</h1>
        <QrCartClient tableCode={tableCode} />
      </div>
    </main>
  );
}
