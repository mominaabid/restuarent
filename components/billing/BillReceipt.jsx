"use client";

import { useI18n } from "@/context/LocaleContext";
import en from "@/lib/i18n/dictionaries/en";
import ar from "@/lib/i18n/dictionaries/ar";
import { DEFAULT_LOGO_URL, RESTAURANT_CONTACT } from "@/lib/constants";
import TaxInvoices from "@/components/billing/TaxInvoice";
import { groupLines } from "@/lib/orderLines";

/**
 * The customer's own copy of the bill, laid out as an 80mm thermal slip.
 *
 * Hidden on screen and revealed only while printing, so tapping "Print bill"
 * on a phone produces a proper POS receipt rather than a screenshot of the web
 * page. Mirrors the admin's Receipt component: monospace for column alignment,
 * dashed rules rather than solid borders (cheap thermal paper smears them),
 * and a tail gap so the printer's cut doesn't clip the last line.
 *
 * Like the tax invoice, it prints English and Arabic together whatever the
 * site language — labels from both dictionaries, and each dish/table/branch
 * name in both where its Arabic was added.
 *
 * Every figure is the server's — amounts and variant names are read straight
 * from the bill payload, never recomputed here.
 */
export default function BillReceipt({ bill, restaurantName, restaurantNameAr }) {
  const { locale, money } = useI18n();
  if (!bill) return null;

  // Settled and invoiced: the printed copy is the tax invoice itself.
  const settled = Number(bill.amount_outstanding ?? 0) <= 0;
  if (settled && bill.invoices?.length) {
    return (
      <div className="bill-receipt hidden">
        <TaxInvoices invoices={bill.invoices} />
      </div>
    );
  }

  const pair = (key) => [en.receipt[key], ar.receipt[key]];
  // How it was actually settled. `paid_method` is cash | card | online, and
  // "PAID" alone told the customer nothing — a receipt has to say what was
  // taken, not just that something was.
  const method = bill.paid_method ? [en.receipt.methods[bill.paid_method] ?? "", ar.receipt.methods[bill.paid_method] ?? ""] : null;

  return (
    <div className="bill-receipt hidden font-mono text-[11px] leading-tight text-black" dir="ltr">
      <div className="text-center">
        <img src={DEFAULT_LOGO_URL} alt="" className="mx-auto mb-1 h-14 w-14 object-contain" />
        <p className="text-[13px] font-bold uppercase"><BiName en={restaurantName} ar={restaurantNameAr} /></p>
        <p className="text-[10px]">{en.contact.address}</p>
        <p className="text-[10px]" dir="rtl">{ar.contact.address}</p>
        <p className="text-[10px]" dir="ltr">{RESTAURANT_CONTACT.phoneDisplay}</p>
        <p className="mt-0.5 text-[10px] font-bold uppercase"><Bi pair={pair("title")} /></p>
      </div>
      {!settled && (
        // Before payment this is a pro-forma, never a tax invoice; fixed
        // Arabic + English like the invoice itself. No QR.
        <div className="my-1 border-2 border-black py-0.5 text-center" dir="ltr">
          <p className="text-[12px] font-bold">Not a tax invoice / <span dir="rtl">ليست فاتورة ضريبية</span></p>
          <p className="text-[9px]">Pro-forma bill · <span dir="rtl">فاتورة مبدئية</span></p>
        </div>
      )}

      <Rule />
      <Row
        label={bill.table_label || bill.table_label_ar ? <Bi pair={[bill.table_label, bill.table_label_ar]} /> : <Bi pair={pair("table")} />}
        value={bill.bill_code}
      />
      {bill.paid_at && <Row label={<Bi pair={pair("paid")} />} value={new Date(bill.paid_at).toLocaleString(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-GB")} />}
      <Rule />

      {(bill.orders ?? []).map((order) => (
        <div key={order.id}>
          {groupLines(order.items ?? []).map(({ key, lines: [item], quantity, total }) => (
            <div key={key} className="mb-0.5 flex justify-between gap-2">
              <span className="min-w-0 flex-1 break-words">
                {quantity} x <BiName en={withVariant(item.name_en, item.variant_name_en)} ar={withVariant(item.name_ar, item.variant_name_ar)} />
              </span>
              <span className="whitespace-nowrap">
                {money(total)}
              </span>
            </div>
          ))}
        </div>
      ))}

      <Rule />
      <div className="flex justify-between text-[13px] font-bold">
        <span><Bi pair={pair("total")} /></span>
        <span>{money(Number(bill.total))}</span>
      </div>
      {Number(bill.amount_paid ?? 0) > 0 && <Row label={<Bi pair={pair("paidToDate")} />} value={money(Number(bill.amount_paid))} />}
      {Number(bill.amount_outstanding ?? 0) > 0 && <Row label={<Bi pair={pair("balanceDue")} />} value={money(Number(bill.amount_outstanding))} />}
      <Rule />
      {method && method[0] && <Row label={<Bi pair={pair("paidBy")} />} value={<Bi pair={method} />} />}
      <p className="mt-1 text-center text-[11px] font-bold"><Bi pair={pair("paidStamp")} /></p>
      <p className="mt-2 text-center text-[11px]">{en.receipt.thankYou}</p>
      <p className="text-center text-[11px]" dir="rtl">{ar.receipt.thankYou}</p>
      {/* Clears the printer's cut line. */}
      <div className="h-8" />
    </div>
  );
}

/** "English / عربي" on one line; just one when the other is missing or the same. */
function Bi({ pair: [english, arabic] }) {
  if (!arabic || arabic === english) return <>{english}</>;
  if (!english) return <span dir="rtl">{arabic}</span>;
  return <>{english} / <span dir="rtl">{arabic}</span></>;
}

/** English, then the Arabic under it when one was added. */
function BiName({ en: english = "", ar: arabic = "" }) {
  const a = (arabic ?? "").trim();
  const e = (english ?? "").trim();
  if (!e) return <span dir="rtl">{a}</span>;
  return <>{e}{a && a !== e && <span className="block" dir="rtl">{a}</span>}</>;
}

function withVariant(name, variant) {
  return name && variant ? `${name} (${variant})` : name ?? "";
}

function Rule() {
  return <div className="my-1 border-t border-dashed border-black" />;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
