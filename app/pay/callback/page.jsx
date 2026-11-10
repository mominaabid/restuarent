import PayCallbackClient from "@/components/billing/PayCallbackClient";
import { getI18n } from "@/lib/i18n/server";

/**
 * Where Moyasar redirects the customer after 3DS / STC Pay.
 *
 * This route deliberately lives OUTSIDE /t/[tableCode]: `callback_url` is
 * configured once, backend-side (CUSTOMER_WEB_BASE_URL), and is the same for
 * every table. The table's own token rides along as `?t=` purely so we know
 * which table page to send the diner back to — it does not authorise anything.
 *
 * Moyasar appends `id`, `status` and `message`. Only `id` is read; `status` is
 * whatever the URL says and is never trusted (see PayCallbackClient).
 */
export async function generateMetadata() {
  const { t } = await getI18n();
  return {
    title: t.callback.pageTitle,
    robots: { index: false, follow: false },
  };
}

export default async function PayCallbackPage({ searchParams }) {
  // searchParams is a Promise in Next 16 and must be awaited. Reading it here,
  // in a server component, avoids needing useSearchParams and its Suspense
  // boundary in the client component below.
  const query = await searchParams;
  const paymentId = firstValue(query?.id);
  const tableCode = firstValue(query?.t);
  const billId = firstValue(query?.bill_id);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-black px-5 py-24">
      <div className="w-full max-w-md">
        <PayCallbackClient paymentId={paymentId} tableCode={tableCode} billId={billId} />
      </div>
    </main>
  );
}

/** A repeated query param arrives as an array; take the first either way. */
function firstValue(value) {
  if (Array.isArray(value)) return value[0] ?? "";
  return typeof value === "string" ? value : "";
}
