import QrOccupancyNotice from "@/components/ordering/QrOccupancyNotice";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TableSessionProvider } from "@/context/TableSessionContext";
import { getTableBySessionToken } from "@/lib/api/tables";
import { getI18n } from "@/lib/i18n/server";

// Applies to every page under /t/[tableCode] — private, per-seating QR
// pages, never indexed. See docs/architecture-plan.md §11.
export const metadata = {
  robots: { index: false, follow: false },
};

export default async function TableSessionLayout({ children, params }) {
  const { tableCode } = await params;
  const table = await getTableBySessionToken(tableCode);

  if (!table) {
    const { t } = await getI18n();
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-brand-black px-6 pt-28 text-center">
          <div>
            <h1 className="font-display text-4xl tracking-wide text-white md:text-5xl">{t.table.unavailableTitle}</h1>
            <p className="mx-auto mt-4 max-w-md font-body text-white/60">{t.table.unavailableBody}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <TableSessionProvider tableCode={tableCode} table={table}>
      <Navbar />
      <QrOccupancyNotice tableCode={tableCode} />
      {children}
      <Footer />
    </TableSessionProvider>
  );
}
