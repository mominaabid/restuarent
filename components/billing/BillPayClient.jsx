"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import MoyasarForm from "@/components/billing/MoyasarForm";
import BillReceipt from "@/components/billing/BillReceipt";
import ReviewPrompt from "@/components/billing/ReviewPrompt";
import { useI18n } from "@/context/LocaleContext";
import { pick } from "@/lib/i18n/config";
import { getTablePhone } from "@/lib/customerPhone";
import { groupLines } from "@/lib/orderLines";
import { apiErrorMessage } from "@/lib/apiError";
import { printSlip } from "@/lib/printSlip";

/**
 * The customer's pay screen.
 *
 * Two ways to settle:
 *   - Card / STC Pay now, through Moyasar's hosted form (3DS redirect).
 *   - Cash or card at the table, which notifies a cashier to come over.
 *
 * The amount shown is always whatever the server last told us. This component
 * never adds anything up itself — `bill.total` and `bill.total_halalas` are
 * recomputed backend-side from the order items on every poll, so voiding an
 * item at the till lowers the figure here within a few seconds.
 */

const POLL_MS = 5000;

export default function BillPayClient({ tableCode, initialBill, expectedBillId, orderNumber, restaurantName = "", restaurantNameAr = "" }) {
  const { t, money } = useI18n();
  const [bill, setBill] = useState(initialBill);
  const [online, setOnline] = useState(null); // request-pay response for method=online
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [reconnecting, setReconnecting] = useState(false);
  const [loaded, setLoaded] = useState(Boolean(initialBill));
  const [needPhone, setNeedPhone] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(Boolean(expectedBillId && initialBill && (String(expectedBillId) !== String(initialBill.id) || initialBill.status === "closed")));
  const billSessionId = expectedBillId || initialBill?.id;
  const phoneRef = useRef("");

  const refresh = useCallback(async () => {
    if (sessionEnded) return;
    // Each phone has its own bill at a table; the number this device ordered
    // with picks it (and the backend never returns anyone else's).
    const phone = phoneRef.current || getTablePhone(tableCode);
    phoneRef.current = phone;
    if (!phone) { setNeedPhone(true); return; }
    try {
      // The pinned bill rides along on every poll; the backend answers 409
      // billSessionEnded rather than ever handing over another party's bill.
      const query = new URLSearchParams({ token: tableCode, phone });
      if (billSessionId) query.set("bill_id", String(billSessionId));
      const response = await fetch(`/api/qr/bill?${query}`, { cache: "no-store" });
      const next = await response.json().catch(() => ({}));
      setLoaded(true);
      if (response.status === 409 || (response.status === 404 && billSessionId)) { setSessionEnded(true); return; }
      if (response.status === 400 && next.error === "error.phoneRequired") { setNeedPhone(true); return; }
      if (response.status === 404) { setBill(null); setReconnecting(false); return; }
      if (!response.ok) { setReconnecting(true); return; }
      if (next.status === "closed") { setSessionEnded(true); return; }
      setBill(next);
      setReconnecting(false);
    } catch {
      // Keep showing the last known total while the connection comes back.
      setReconnecting(true);
    }
  }, [tableCode, billSessionId, sessionEnded]);

  // Polling, matching QrOrderTracking's existing approach. This is how the
  // phone learns the cashier accepted the cash, or that the webhook settled an
  // online payment while the customer was still on this screen.
  useEffect(() => {
    const first = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, POLL_MS);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [refresh]);

  /** Print the 80mm slip rather than the web page (lib/printSlip.js). */
  function printBill() {
    printSlip(".bill-receipt");
  }

  async function post(path, body, label) {
    setError("");
    setBusy(label);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: tableCode, bill_id: billSessionId, phone: phoneRef.current || getTablePhone(tableCode), ...body }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload.error === "error.billSessionEnded" || payload.error === "error.billNotFound") setSessionEnded(true);
        setError(apiErrorMessage(t, payload, response.status, t.pay.errors, t.pay.genericError));
        return null;
      }
      setBill(payload);
      return payload;
    } catch {
      setError(t.pay.unreachable);
      return null;
    } finally {
      setBusy("");
    }
  }

  async function payOnline() {
    const payload = await post("/api/qr/bill/request-pay", { method: "online" }, "online");
    if (payload) setOnline(payload);
  }

  async function payCash() {
    await post("/api/qr/bill/request-pay", { method: "cash" }, "cash");
  }

  async function cancelRequest() {
    const payload = await post("/api/qr/bill/cancel-pay", {}, "cancel");
    if (payload) setOnline(null);
  }

  if (sessionEnded) {
    // The cashier usually releases the table right after payment; the guest
    // can still review the bill they just settled (ReviewPrompt hides itself
    // when that bill isn't theirs or can't be reviewed).
    return (
      <>
        <Notice>{t.pay.sessionEnded}</Notice>
        <ReviewPrompt tableCode={tableCode} billId={billSessionId} className="mt-5" />
      </>
    );
  }
  if (needPhone) {
    return (
      <Notice>
        {t.pay.needPhone}{" "}
        <Link href={`/t/${encodeURIComponent(tableCode)}/order`} className="text-brand-gold underline">{t.pay.openMyOrder}</Link>
      </Notice>
    );
  }
  if (!bill) {
    if (!loaded) return <p className="font-body text-white/55">{t.pay.loading}</p>;
    return <Notice>{t.pay.noBill}</Notice>;
  }

  const selectedOrder = orderNumber ? bill.orders?.find((order) => order.order_number === orderNumber) : null;
  const allCancelled = Boolean(bill.orders?.length) && bill.orders.every((order) => order.status === "cancelled");
  if (selectedOrder?.status === "cancelled" || allCancelled) {
    return <Notice>{t.pay.cancelled}</Notice>;
  }

  const addMore = <Link href={`/t/${encodeURIComponent(tableCode)}/menu`} className="mt-4 block text-center font-body text-xs font-semibold text-brand-gold underline">{t.pay.addMore}</Link>;
  const addCancelledNotice = (
    <>
      {reconnecting ? <Notice>{t.pay.reconnecting}</Notice> : null}
      {bill.payment_request_cancelled_by_add ? <Notice>{t.pay.itemsAdded}</Notice> : null}
    </>
  );

  // ---- paid ---------------------------------------------------------------
  if (bill.status === "paid" || bill.status === "closed") {
    return (
      <>
        <div className="fade-up-in rounded-2xl border border-brand-gold/30 bg-brand-black-soft p-6 text-center">
          <p className="font-display text-4xl tracking-wide text-brand-gold">{t.pay.paymentDone}</p>
          <p className="mt-2 font-body text-sm text-white/65">
            {t.pay.paid(money(Number(bill.amount_paid ?? bill.total)))} {Number(bill.amount_outstanding ?? 0) > 0 ? t.pay.remainsDue(money(Number(bill.amount_outstanding))) : t.pay.thankYou}
          </p>
          <p className="mt-4 font-body text-xs text-white/40">{t.pay.addUntilReleased}</p>
          <button
            onClick={printBill}
            className="mt-5 rounded-xl border border-white/20 px-5 py-2.5 font-body text-xs font-semibold uppercase tracking-[0.14em] text-white/80 transition-colors hover:border-brand-gold hover:text-brand-gold"
          >
            {t.pay.print}
          </button>
          {bill.status === "paid" && <Link href={`/t/${encodeURIComponent(tableCode)}/menu`} className="mt-3 block font-body text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold underline">{t.pay.addAnother}</Link>}
          {bill.invoices?.filter((doc) => doc.kind === "invoice").map((doc) => (
            <Link key={doc.uuid} href={`/receipt/${encodeURIComponent(doc.uuid)}`} className="mt-3 block font-body text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold underline">
              {t.invoice.view} · {doc.number}
            </Link>
          ))}
          <BillReceipt bill={bill} restaurantName={restaurantName} restaurantNameAr={restaurantNameAr} />
        </div>
        <ReviewPrompt tableCode={tableCode} billId={bill.id} className="mt-5" />
      </>
    );
  }

  // ---- nothing to pay for -------------------------------------------------
  if (!bill.orders?.length || Number(bill.total) <= 0) {
    return (
      <Notice>
        {t.pay.nothingYet}{" "}
        <Link href={`/t/${encodeURIComponent(tableCode)}/menu`} className="text-brand-gold underline">
          {t.pay.orderSomething}
        </Link>
        .
      </Notice>
    );
  }

  const summary = <BillSummary bill={bill} />;

  // ---- still cooking ------------------------------------------------------
  if (!bill.ready_to_pay && bill.status === "open") {
    return (
      <>
        {summary}
        {addCancelledNotice}
        <button disabled className="btn-primary mt-5 w-full cursor-not-allowed !rounded-xl !py-4 opacity-50">
          {t.pay.pay(money(Number(bill.amount_outstanding ?? bill.total)))}
        </button>
        <p className="mt-2 text-center font-body text-xs text-white/50">{t.pay.payAfterServed}</p>
        {addMore}
      </>
    );
  }

  // ---- waiting on a cashier (cash) ---------------------------------------
  if (bill.status === "pay_requested" && bill.requested_method === "cash") {
    return (
      <>
        {summary}
        {addCancelledNotice}
        <div className="fade-up-in mt-5 rounded-2xl border border-brand-gold/30 bg-brand-black-soft p-6 text-center">
          <p className="font-display text-2xl tracking-wide text-white">{t.pay.waitingCash}</p>
          <p className="mt-2 font-body text-sm text-white/60">{t.pay.haveReady(money(Number(bill.amount_outstanding ?? bill.total)))}</p>
        </div>
        {addMore}
        {error ? <ErrorText>{error}</ErrorText> : null}
        <SecondaryButton onClick={cancelRequest} busy={busy === "cancel"}>
          {t.pay.cancelOrderMore}
        </SecondaryButton>
      </>
    );
  }

  // The bill snapshot is authoritative after a reload/back navigation. Re-open
  // the existing online request on demand to recover the hosted form config.
  if (bill.status === "pay_requested" && bill.requested_method === "online" && !online) {
    return <>
      {summary}
      {addCancelledNotice}
      <Notice>{t.pay.onlineInProgress}</Notice>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <button onClick={payOnline} disabled={Boolean(busy)} className="btn-primary mt-5 w-full !rounded-xl !py-4 disabled:opacity-60">
        {busy === "online" ? t.pay.restoring : t.pay.continuePayment(money(Number(bill.amount_outstanding ?? bill.total)))}
      </button>
      {addMore}
    </>;
  }

  // ---- online form --------------------------------------------------------
  if (bill.status === "pay_requested" && bill.requested_method === "online" && online) {
    return (
      <>
        {summary}
        {addCancelledNotice}
        <div className="fade-up-in mt-5 rounded-2xl border border-white/10 bg-brand-black-soft p-5">
          <p className="mb-4 font-body text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            {t.pay.paySecurely(money(Number(bill.amount_outstanding ?? bill.total)))}
          </p>
          <MoyasarForm
            bill={bill}
            publishableKey={online.publishable_key}
            callbackUrl={online.callback_url}
            description={online.description}
            onFailure={setError}
          />
        </div>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <SecondaryButton onClick={cancelRequest} busy={busy === "cancel"}>
          {t.pay.cancelBack}
        </SecondaryButton>
        {addMore}
      </>
    );
  }

  // ---- choose how to pay --------------------------------------------------
  return (
    <>
      {summary}
      {addCancelledNotice}
      {bill.status === "pay_requested" ? (
        <Notice>{t.pay.locked}</Notice>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}

      <div className="mt-5 space-y-3">
        <button
          onClick={payOnline}
          disabled={Boolean(busy)}
          className="btn-primary w-full !rounded-xl !py-4 disabled:opacity-60"
        >
          {busy === "online" ? t.pay.opening : t.pay.payByCard(money(Number(bill.amount_outstanding ?? bill.total)))}
        </button>
        <p className="text-center font-body text-[11px] text-white/35">
          {t.pay.cardNetworks}
        </p>

        <button
          onClick={payCash}
          disabled={Boolean(busy)}
          className="w-full rounded-xl border border-white/20 bg-transparent px-4 py-4 font-body text-sm font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-brand-gold hover:text-brand-gold disabled:opacity-60"
        >
          {busy === "cash" ? t.pay.calling : t.pay.payAtTable}
        </button>
        <p className="text-center font-body text-[11px] text-white/35">
          {t.pay.cashOrCard}
        </p>
      </div>

      <p className="mt-5 text-center font-body text-[11px] text-white/35">
        {t.pay.addCancelsRequest}
      </p>
      {addMore}
    </>
  );
}

function BillSummary({ bill }) {
  const { t, locale, money } = useI18n();
  return (
    <div className="fade-up-in rounded-2xl border border-white/10 bg-brand-black-soft p-5">
      {bill.orders.map((order) => (
        <div key={order.id} className="mb-3 last:mb-0">
          <p className="mb-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
            {order.order_number}{order.status === "cancelled" ? t.pay.cancelledTag : ""}
          </p>
          {groupLines(order.items).map(({ key, lines: [item], quantity, total }) => (
            <div key={key} className="flex items-center justify-between py-1 font-body text-sm text-white/70">
              <span>
                {quantity}× {pick(locale, item.name_en, item.name_ar)}
                {item.variant_name_en || item.variant_name_ar
                  ? ` (${pick(locale, item.variant_name_en, item.variant_name_ar)})`
                  : ""}
              </span>
              <span className="tabular-nums">{money(total)}</span>
            </div>
          ))}
        </div>
      ))}
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 font-body text-sm font-semibold text-white">
        <span>{t.common.total}</span>
        <span className="font-display text-2xl tracking-wide text-brand-gold">{money(Number(bill.total))}</span>
      </div>
      {Number(bill.amount_paid ?? 0) > 0 && (
        <>
          <div className="mt-2 flex items-center justify-between font-body text-xs text-white/55"><span>{t.common.paidSoFar}</span><span>{money(Number(bill.amount_paid))}</span></div>
          <div className="mt-1 flex items-center justify-between font-body text-xs text-white/55"><span>{t.common.remaining}</span><span>{money(Number(bill.amount_outstanding ?? 0))}</span></div>
        </>
      )}
    </div>
  );
}

function Notice({ children }) {
  return (
    <p className="mt-5 rounded-xl border border-brand-gold/25 bg-brand-black-soft p-4 font-body text-sm text-white/70">
      {children}
    </p>
  );
}

function ErrorText({ children }) {
  return (
    <p role="alert" className="mt-4 rounded-xl border border-brand-red/40 bg-brand-red/10 p-3 font-body text-sm text-white/85">
      {children}
    </p>
  );
}

function SecondaryButton({ onClick, busy, children }) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="mt-4 w-full font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/45 underline transition-colors hover:text-brand-red disabled:opacity-50"
    >
      {busy ? t.pay.working : children}
    </button>
  );
}
