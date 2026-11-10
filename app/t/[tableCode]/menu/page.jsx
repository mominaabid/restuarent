import Link from "next/link";
import TableBanner from "@/components/ordering/TableBanner";
import QrMenu from "@/components/ordering/QrMenu";
import QrCartBar, { QrCartLink } from "@/components/ordering/QrCartBar";
import { getQrMenu } from "@/lib/api/products";
import { getTableBySessionToken } from "@/lib/api/tables";
import { getBackendWebSocketUrl } from "@/lib/qrBackend";
import LiveMenuSync from "@/components/LiveMenuSync";
import { getI18n } from "@/lib/i18n/server";

export default async function TableMenuPage({ params }) {
  const { tableCode } = await params;
  const [table, { locale, t }] = await Promise.all([getTableBySessionToken(tableCode), getI18n()]);
  // Unknown/closed table: the layout already shows "table not available".
  if (!table) return null;
  const { items, categories } = await getQrMenu(table.branchId, locale);

  return (
    // pb-28: room for the fixed cart bar so it never covers the last item.
    <main className="min-h-screen bg-brand-black px-4 pb-28 pt-24 sm:px-5 md:px-8 md:pt-32">
      <div className="mx-auto max-w-3xl">
        <TableBanner />
        <LiveMenuSync branchId={table.branchId} socketBaseUrl={getBackendWebSocketUrl()} />
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="font-body text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-gold sm:text-xs">{t.qrMenu.kicker}</p>
            <h1 className="mt-0.5 font-display text-3xl tracking-wide text-white sm:text-4xl">{t.qrMenu.heading}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/t/${tableCode}/order`}
              className="rounded-full border border-white/20 px-3.5 py-2 font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85 transition-transform active:scale-95 hover:border-brand-gold hover:text-brand-gold sm:px-4 sm:py-2.5 sm:text-xs"
            >
              {t.qrMenu.myOrder}
            </Link>
            <QrCartLink tableCode={tableCode} />
          </div>
        </div>
        <QrMenu items={items} categories={categories} />
      </div>
      <QrCartBar tableCode={tableCode} />
    </main>
  );
}
