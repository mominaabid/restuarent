"use client";

import { Fragment } from "react";
import { QRCodeSVG } from "qrcode.react";
import { DEFAULT_LOGO_URL } from "@/lib/constants";

/**
 * The customer's tax invoice (or credit note) as issued: shown on screen as a
 * white paper slip, and printed at 80mm by lib/printSlip.js (InvoiceActions).
 *
 * A legal document, so it does not follow the site language: Arabic is
 * mandatory and English sits alongside. Same layout as the restaurant's
 * printed slip (restaurant-admin components/zatca/ZatcaReceipt.tsx).
 *
 * Every figure comes from the backend's issued document, to the halala;
 * nothing is added up here.
 */

const L = {
  simplified: ["Simplified Tax Invoice", "فاتورة ضريبية مبسطة"],
  standard: ["Tax Invoice", "فاتورة ضريبية"],
  creditNote: ["Credit Note", "إشعار دائن"],
  debitNote: ["Debit Note", "إشعار مدين"],
  test: ["TEST", "تجريبي"],
  testNote: ["Not a legally valid invoice", "ليست فاتورة نظامية"],
  vat: ["VAT No.", "الرقم الضريبي"],
  crn: ["CR No.", "السجل التجاري"],
  number: ["Invoice No.", "رقم الفاتورة"],
  noteNumber: ["Note No.", "رقم الإشعار"],
  date: ["Date", "التاريخ"],
  time: ["Time", "الوقت"],
  orderType: ["Order type", "نوع الطلب"],
  table: ["Table", "الطاولة"],
  order: ["Order", "الطلب"],
  original: ["Original invoice", "الفاتورة الأصلية"],
  reason: ["Reason", "السبب"],
  item: ["Item", "المنتجات"],
  quantity: ["Qty", "الكمية"],
  unitNet: ["Price (excl. VAT)", "السعر"],
  lineVat: ["VAT", "ضريبة القيمة المضافة"],
  lineInclusive: ["Total incl. VAT", "السعر شامل ضريبة القيمة المضافة"],
  net: ["Total taxable amount", "إجمالي المبلغ الخاضع للضريبة"],
  vatAmount: ["VAT", "ضريبة القيمة المضافة"],
  inclusive: ["Total incl. VAT", "المجموع مع الضريبة"],
  end: ["End of invoice", "إغلاق الفاتورة"],
  rounding: ["Rounding", "فرق التقريب"],
  payable: ["Amount due", "المبلغ المستحق"],
  refund: ["Amount refunded", "المبلغ المسترد"],
  tip: ["Tip (not part of tax invoice)", "إكرامية (ليست جزءاً من الفاتورة الضريبية)"],
  currency: ["Amounts in SAR", "المبالغ بالريال السعودي"],
};

const COLUMNS = [L.item, L.quantity, L.unitNet, L.lineVat, L.lineInclusive];

/** The seller's second identifier, labelled for what it is (BR-KSA-08). */
const ID_SCHEMES = {
  CRN: L.crn,
  MOM: ["MOMRA licence", "رخصة وزارة الشؤون البلدية"],
  MLS: ["MLSD licence", "رخصة وزارة الموارد البشرية"],
  SAG: ["SAGIA licence", "ترخيص الاستثمار"],
  700: ["700 No.", "الرقم الموحد 700"],
  OTH: ["ID No.", "رقم الهوية"],
};

const ORDER_TYPES = {
  dine_in: ["Dine-in", "محلي"],
  takeaway: ["Takeaway", "سفري"],
  qr: ["Table QR order", "طلب من الطاولة"],
  web: ["Online order", "طلب أونلاين"],
};

const METHODS = {
  cash: ["Cash", "نقداً"],
  card: ["Card", "بطاقة"],
  other: ["Other", "أخرى"],
  mada: ["mada", "مدى"],
  visa: ["Visa", "فيزا"],
  master: ["Mastercard", "ماستركارد"],
  amex: ["American Express", "أمريكان إكسبريس"],
  applepay: ["Apple Pay", "Apple Pay"],
  googlepay: ["Google Pay", "Google Pay"],
  samsungpay: ["Samsung Pay", "Samsung Pay"],
  stcpay: ["STC Pay", "STC Pay"],
};

function titleOf(invoice) {
  if (invoice.kind === "credit_note") return L.creditNote;
  if (invoice.kind === "debit_note") return L.debitNote;
  return invoice.simplified ? L.simplified : L.standard;
}

function addressLines(address = {}) {
  const first = [address.building_no, address.street].filter(Boolean).join(" ");
  const second = [address.district, address.city, address.postal_code].filter(Boolean).join(", ");
  return [first + (address.additional_no ? ` (${address.additional_no})` : ""), second].filter(Boolean);
}

/** Several documents (an invoice and its credit note) print one after another. */
export default function TaxInvoices({ invoices, screen = true }) {
  if (!invoices?.length) return null;
  return (
    <div className={`tax-invoice ${screen ? "" : "hidden"} space-y-4`} dir="ltr">
      {invoices.map((invoice) => (
        <TaxInvoice key={invoice.uuid} invoice={invoice} />
      ))}
    </div>
  );
}

function TaxInvoice({ invoice }) {
  const { seller = {}, totals = {} } = invoice;
  const isNote = invoice.kind !== "invoice";
  const rate = String(Number(totals.rate ?? 15));
  const rounding = Number(totals.rounding) !== 0;
  // The amount due is its own line only where it differs from the total incl.
  // VAT (a rounding adjustment), and on a credit note, where it is the refund.
  const showPayable = rounding || invoice.kind === "credit_note";
  return (
    <article className="mx-auto w-full max-w-[80mm] break-after-page rounded-md bg-white p-3 text-[11px] leading-tight text-black shadow-lg print:rounded-none print:p-0 print:shadow-none">
      {invoice.is_test && <Banner pair={L.test} detail={L.testNote} />}

      <header className="text-center">
        <img src={seller.logo_url || DEFAULT_LOGO_URL} alt="" className="mx-auto mb-1 h-14 w-14 object-contain" />
        <p className="text-[13px] font-bold" dir="rtl">{seller.name_ar}</p>
        {seller.name_en && seller.name_en !== seller.name_ar && <p className="text-[12px] font-bold">{seller.name_en}</p>}
        {addressLines(seller.address).map((line) => <p key={line} className="text-[10px]">{line}</p>)}
        <Field pair={L.vat} value={seller.vat_number} />
        {seller.other_id && <Field pair={ID_SCHEMES[seller.other_id_scheme] ?? L.crn} value={seller.other_id} />}
        <p className="mt-1.5 text-[13px] font-bold" dir="rtl">{titleOf(invoice)[1]}</p>
        <p className="text-[12px] font-bold uppercase">{titleOf(invoice)[0]}</p>
      </header>

      <Rule />
      <Field pair={isNote ? L.noteNumber : L.number} value={invoice.number} />
      <Field pair={L.date} value={invoice.issue_date} />
      <Field pair={L.time} value={invoice.issue_time} />
      {ORDER_TYPES[invoice.order_type] && <Field pair={L.orderType} value={ORDER_TYPES[invoice.order_type].join(" / ")} />}
      {invoice.table && <Field pair={L.table} value={invoice.table} />}
      {invoice.order_numbers?.length > 0 && <Field pair={L.order} value={invoice.order_numbers.join(", ")} />}

      {isNote && invoice.original && (
        <>
          <Rule />
          <Field pair={L.original} value={invoice.original.number} />
          {invoice.reason && <Field pair={L.reason} value={invoice.reason} />}
        </>
      )}

      <Rule />
      <ItemsTable items={invoice.items ?? []} />

      <Rule />
      <p className="text-center text-[9px]">{L.currency[0]} · <span dir="rtl">{L.currency[1]}</span></p>
      <Total pair={L.net} value={totals.net} />
      <Total pair={[`${L.vatAmount[0]} (${rate}%)`, `${L.vatAmount[1]} (${rate}%)`]} value={totals.vat} />
      <Total pair={L.inclusive} value={totals.inclusive} strong={!showPayable} />
      {rounding && <Total pair={L.rounding} value={totals.rounding} />}
      {showPayable && <Total pair={invoice.kind === "credit_note" ? L.refund : L.payable} value={totals.payable} strong />}

      {invoice.payments?.length > 0 && (
        <>
          <Rule />
          {invoice.payments.map((payment, index) => (
            <Total key={index} pair={METHODS[payment.method] ?? [payment.method, payment.method]} value={payment.amount} />
          ))}
        </>
      )}

      {!isNote && Number(invoice.tip) > 0 && (
        <>
          <Rule />
          <Total pair={L.tip} value={invoice.tip} />
        </>
      )}

      <Rule />
      <p className="text-center font-bold">&gt;&gt;&gt;&gt; <span dir="rtl">{L.end[1]}</span> / {L.end[0]} &lt;&lt;&lt;&lt;</p>
      {invoice.qr && (
        <>
          <div className="my-2 flex justify-center">
            {/* 34mm printed: over the 30mm the Fatoora app needs. */}
            <QRCodeSVG value={invoice.qr} level="M" marginSize={2} style={{ width: "34mm", height: "34mm" }} />
          </div>
        </>
      )}

      {(invoice.footer_ar || invoice.footer_en) && (
        <div className="mt-1 text-center">
          {invoice.footer_ar && <p dir="rtl">{invoice.footer_ar}</p>}
          {invoice.footer_en && <p>{invoice.footer_en}</p>}
        </div>
      )}
      {invoice.is_test && <Banner pair={L.test} />}
      <div className="h-6 print:h-8" />
    </article>
  );
}

function Rule() {
  return <div className="my-1 border-t border-dashed border-black" />;
}

function Banner({ pair, detail }) {
  return (
    <div className="my-1 border-2 border-black py-0.5 text-center">
      <p className="text-[13px] font-bold">{pair[0]} / <span dir="rtl">{pair[1]}</span></p>
      {detail && <p className="text-[9px]">{detail[0]} · <span dir="rtl">{detail[1]}</span></p>}
    </div>
  );
}

function Field({ pair, value }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-1.5">
      <span className="text-[9px]">{pair[0]}</span>
      <span className="break-all text-center font-mono font-bold">{value}</span>
      <span className="text-[9px]" dir="rtl">{pair[1]}</span>
    </div>
  );
}

/**
 * The items table of ZATCA's illustrative simplified tax invoice, right to
 * left: item, qty, unit price excl. VAT, VAT, line total incl. VAT, one row
 * per invoice line as the XML states it. A dish whose net price doesn't
 * divide evenly was invoiced as two lines (2 x 8.70 and 1 x 8.69 for
 * 3 x 10.00): both are shown, the name on the first. Documents issued before
 * the backend stored their lines show a dash, not a figure worked out here.
 */
function ItemsTable({ items }) {
  // The name gets its own full-width row above its figures. Sharing a row
  // with four amount columns left it almost no width at 80mm or on a phone
  // (the amount headers claimed it), so names printed one letter per line.
  const [itemLabel, ...amountLabels] = COLUMNS;
  return (
    <div className="grid grid-cols-4 gap-x-1.5 gap-y-1" dir="rtl">
      <span className="col-span-4 text-[8px] font-bold">
        {itemLabel[1]}<span className="block text-right" dir="ltr">{itemLabel[0]}</span>
      </span>
      {amountLabels.map((pair) => (
        <span key={pair[0]} className="min-w-0 break-words text-center text-[8px] font-bold">
          {pair[1]}<span className="block" dir="ltr">{pair[0]}</span>
        </span>
      ))}
      {items.map((item, index) => {
        const rows = item.lines?.length ? item.lines
          : [{ quantity: item.quantity, unit_net: "—", vat: "—", total: item.total }];
        return rows.map((row, rowIndex) => (
          <Fragment key={`${index}-${rowIndex}`}>
            {rowIndex === 0 && (
              <span className="col-span-4 mt-1 break-words font-bold">
                {item.name_ar}{item.variant_ar ? ` (${item.variant_ar})` : ""}
                {item.name_en && item.name_en !== item.name_ar && (
                  <span className="block text-right" dir="ltr">{item.name_en}{item.variant_en ? ` (${item.variant_en})` : ""}</span>
                )}
              </span>
            )}
            <Amount>{row.quantity}</Amount>
            <Amount>{row.unit_net}</Amount>
            <Amount>{row.vat}</Amount>
            <Amount>{row.total}</Amount>
          </Fragment>
        ));
      })}
    </div>
  );
}

function Amount({ children }) {
  return <span className="text-center font-mono tabular-nums" dir="ltr">{children}</span>;
}

/** Right to left like the items table: the Arabic label (English under it) on the right, the amount on the left. */
function Total({ pair, value, strong }) {
  return (
    <div className={`flex items-baseline justify-between gap-2 ${strong ? "text-[13px] font-bold" : ""}`} dir="rtl">
      <span className="min-w-0">
        {pair[1]}
        <span className="block text-right text-[9px]" dir="ltr">{pair[0]}</span>
      </span>
      <span className="whitespace-nowrap font-mono tabular-nums">{value}</span>
    </div>
  );
}
