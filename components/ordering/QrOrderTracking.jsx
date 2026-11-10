"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/context/LocaleContext";
import { useCart } from "@/context/CartContext";
import { groupLines, sharedStatus, statusBreakdown } from "@/lib/orderLines";
import { pick } from "@/lib/i18n/config";
import { clearPinnedBill, getPinnedBill, pinBill } from "@/lib/billPin";
import { getTablePhone, setTablePhone } from "@/lib/customerPhone";
import { playAlert, unlockAlertSound } from "@/lib/alertSound";

/**
 * The customer's live order page for a scanned table.
 *
 * Loads through the table session token plus the phone number this device
 * ordered with (remembered at checkout, asked for once otherwise) — no order
 * code. Every phone has its own bill at a table, so it polls only this
 * phone's bill (orders, lines and amounts computed server-side) with the bill
 * id it pinned; another party, or a later seating, is never shown — the
 * backend answers 409 billSessionEnded instead. Earlier visits of the same
 * phone are not shown — only the current bill.
 *
 * The order-number + phone lookup (/order/<number>) remains a separate,
 * optional fallback for another device; nothing here depends on it.
 */

const POLL_MS = 5000;
const SOCKET_RETRY_BASE_MS = 1000;
const SOCKET_RETRY_MAX_MS = 30000;
/** How long the "table released" thank-you shows before going back to the website. */
const RELEASED_REDIRECT_MS = 4000;
const RETRY_MS = 10000;
const RATE_LIMIT_MS = 20000;

// Status titles/descriptions per order state live in the dictionaries (tracking.states).

/** Cancelled orders this phone has already been told about, so a reload doesn't pop the notice again. */
const SEEN_CANCELLED_KEY = "qr-seen-cancelled-orders";

function readSeenCancelled() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN_CANCELLED_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function markCancelledSeen(ids) {
  try {
    const seen = readSeenCancelled();
    ids.forEach((id) => seen.add(String(id)));
    // Keep the newest few hundred; ids only grow.
    window.localStorage.setItem(SEEN_CANCELLED_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    // Storage blocked: the notice may show again after a reload — harmless.
  }
}

export default function QrOrderTracking({ tableCode, orderNumber = "", initialBillId = "", socketBaseUrl = "" }) {
  const router = useRouter();
  const { t, money } = useI18n();
  const { clearActiveTable } = useCart();
  const [bill, setBill] = useState(null);
  // loading | needPhone | ready | empty | ended | notFound
  const [phase, setPhase] = useState("loading");
  // null | offline | network | server | rateLimited
  const [connection, setConnection] = useState(null);
  const [phoneInput, setPhoneInput] = useState("");
  const pinnedRef = useRef("");
  const phoneRef = useRef("");
  const timerRef = useRef(0);
  const refreshRef = useRef(() => {});
  // Last seen status per order (and of the bill), to announce changes.
  const seenRef = useRef(null);
  const [banner, setBanner] = useState(null);
  const bannerTimerRef = useRef(0);
  // Orders the restaurant cancelled that this phone hasn't acknowledged yet.
  const [cancelNotice, setCancelNotice] = useState(null);

  /** Loud sound + vibration + a big banner when an order (or the bill) changes status. */
  const announceChanges = useCallback((nextBill) => {
    const orders = new Map((nextBill.orders ?? []).map((order) => [String(order.id), order.status]));
    const previous = seenRef.current;
    seenRef.current = { orders, bill: nextBill.status };

    // A cancellation gets a popup that stays until the customer taps it —
    // including one that happened while this page was closed or asleep.
    const seenCancelled = readSeenCancelled();
    const newlyCancelled = (nextBill.orders ?? []).filter(
      (order) => order.status === "cancelled" && !seenCancelled.has(String(order.id))
    );
    if (newlyCancelled.length) {
      markCancelledSeen(newlyCancelled.map((order) => order.id));
      const allCancelled = (nextBill.orders ?? []).every((order) => order.status === "cancelled");
      setCancelNotice({ orderNumbers: newlyCancelled.map((order) => order.order_number), allCancelled });
      playAlert("update");
    }

    if (!previous) return; // first load: nothing else has "changed" yet
    let change = null;
    for (const order of nextBill.orders ?? []) {
      const before = previous.orders.get(String(order.id));
      if (order.status === "cancelled") continue; // shown as the popup above
      if (before && before !== order.status) {
        change = { order, kind: order.status === "ready" ? "ready" : "update" };
        if (change.kind === "ready") break;
      }
    }
    if (!change && previous.bill !== nextBill.status && nextBill.status === "paid") change = { kind: "paid" };
    if (!change) return;
    playAlert(change.kind === "ready" ? "ready" : "update");
    const [title, description] = change.order
      ? (t.tracking.states[change.order.status] ?? [t.tracking.orderUpdated, ""])
      : [t.tracking.paymentDone, t.tracking.thankYou];
    setBanner({ title, description, kind: change.kind, orderNumber: change.order?.order_number ?? "" });
    window.clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = window.setTimeout(() => setBanner(null), 8000);
  }, [t]);

  // Phones only allow sound after the first tap on the page.
  useEffect(() => {
    const unlock = () => unlockAlertSound();
    window.addEventListener("pointerdown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const refresh = useCallback(async () => {
    window.clearTimeout(timerRef.current);
    let next = POLL_MS;
    const pinned = pinnedRef.current;
    const phone = phoneRef.current;
    if (!phone) {
      // Every phone has its own bill at a table: without the number this
      // device ordered with, there is nothing it may be shown.
      setPhase("needPhone");
      return;
    }
    try {
      const query = new URLSearchParams({ token: tableCode, phone });
      if (pinned) query.set("bill_id", pinned);
      const response = await fetch(`/api/qr/bill?${query}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        if (!pinned) {
          pinnedRef.current = String(body.id);
          pinBill(tableCode, body.id);
        }
        if (body.status === "closed") {
          setBill(null);
          setPhase("ended");
          setConnection(null);
          return;
        }
        announceChanges(body);
        setBill(body);
        setPhase("ready");
        setConnection(null);
      } else if (response.status === 400 && body.error === "error.phoneRequired") {
        setPhase("needPhone");
        return;
      } else if (response.status === 409 && body.error === "error.billSessionEnded") {
        // Released, or another party's bill is current: show nothing of it.
        setBill(null);
        setPhase("ended");
        setConnection(null);
        return;
      } else if (response.status === 404 && body.error === "error.billNotFound") {
        if (pinned) {
          setBill(null);
          setPhase("ended");
          return;
        }
        setPhase("empty");
        setConnection(null);
      } else if (response.status === 404) {
        setBill(null);
        setPhase("notFound");
        return;
      } else if (response.status === 429) {
        setConnection("rateLimited");
        next = RATE_LIMIT_MS;
      } else {
        setConnection("server");
        next = RETRY_MS;
      }
    } catch {
      setConnection(typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "network");
      next = RETRY_MS;
    }
    timerRef.current = window.setTimeout(() => refreshRef.current(), next);
  }, [tableCode, announceChanges]);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // Live push from the restaurant: any order/bill change at this table
  // (cancelled, paid at the till, released) reloads at once instead of
  // waiting for the next poll. Polling stays as the fallback.
  useEffect(() => {
    if (!socketBaseUrl || !tableCode) return undefined;
    let stopped = false;
    let socket = null;
    let retryTimer = 0;
    let debounceTimer = 0;
    let attempt = 0;
    const reload = () => {
      window.clearTimeout(debounceTimer);
      // One change fires several events (order, items, bill) — reload once.
      debounceTimer = window.setTimeout(() => void refreshRef.current(), 250);
    };
    const connect = () => {
      if (stopped) return;
      const next = new WebSocket(`${socketBaseUrl}/ws/table/?session=${encodeURIComponent(tableCode)}`);
      socket = next;
      next.onopen = () => { attempt = 0; };
      next.onmessage = reload;
      next.onclose = () => {
        if (stopped || socket !== next) return;
        socket = null;
        retryTimer = window.setTimeout(connect, Math.min(SOCKET_RETRY_BASE_MS * 2 ** attempt, SOCKET_RETRY_MAX_MS));
        attempt += 1;
      };
    };
    connect();
    return () => {
      stopped = true;
      window.clearTimeout(retryTimer);
      window.clearTimeout(debounceTimer);
      socket?.close();
    };
  }, [socketBaseUrl, tableCode]);

  // Table released (session ended): thank the customer, then back to the website.
  useEffect(() => {
    if (phase !== "ended") return undefined;
    window.clearTimeout(timerRef.current);
    clearPinnedBill(tableCode);
    const timer = window.setTimeout(() => {
      // Back on the website this device is no longer seated anywhere.
      clearActiveTable();
      router.replace("/");
    }, RELEASED_REDIRECT_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clearActiveTable is recreated each render
  }, [phase, router, tableCode]);

  useEffect(() => {
    // The id from the order response (?bill_id=) wins; otherwise the one this
    // tab pinned earlier; otherwise the first bill this page loads gets pinned.
    if (initialBillId) {
      pinnedRef.current = String(initialBillId);
      pinBill(tableCode, initialBillId);
    } else {
      pinnedRef.current = getPinnedBill(tableCode);
    }
    phoneRef.current = getTablePhone(tableCode);
    void refreshRef.current();
    const onOnline = () => void refreshRef.current();
    const onOffline = () => setConnection("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearTimeout(timerRef.current);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [initialBillId, tableCode]);

  const menuHref = `/t/${encodeURIComponent(tableCode)}/menu`;
  const retry = () => void refresh();
  const submitPhone = (event) => {
    event.preventDefault();
    const value = phoneInput.trim();
    if (value.replace(/\D/g, "").length < 9) return;
    setTablePhone(tableCode, value);
    phoneRef.current = value;
    setPhase("loading");
    void refresh();
  };

  if (phase === "needPhone") {
    return (
      <StateCard title={t.tracking.yourOrderTitle}>
        <p>{t.tracking.enterPhone}</p>
        <form onSubmit={submitPhone} className="mx-auto mt-4 max-w-sm space-y-3 text-start">
          <input
            type="tel" autoComplete="tel" value={phoneInput} onChange={(event) => setPhoneInput(event.target.value)}
            aria-label={t.tracking.phoneAria} placeholder="05x xxx xxxx" dir="ltr"
            className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-white"
          />
          <button className="btn-primary w-full !rounded-xl !py-3">{t.tracking.showMyOrder}</button>
        </form>
        <Link href={menuHref} className="mt-4 inline-block text-xs text-brand-gold underline">{t.tracking.noOrderYet}</Link>
      </StateCard>
    );
  }

  if (phase === "ended") {
    return (
      <StateCard title={t.tracking.endedTitle}>
        <p>{t.tracking.endedBody}</p>
        <button
          onClick={() => router.replace("/")}
          className="btn-primary mt-4 inline-block !rounded-xl"
        >
          {t.tracking.goNow}
        </button>
        <p className="mt-3 text-xs text-white/45">{t.tracking.orderAgain}</p>
      </StateCard>
    );
  }
  if (phase === "notFound") {
    return <StateCard title={t.tracking.notFoundTitle}><p>{t.tracking.notFoundBody}</p></StateCard>;
  }
  if (!bill) {
    if (phase === "empty") {
      return (
        <StateCard title={t.tracking.emptyTitle}>
          <p>{t.tracking.emptyBody}</p>
          <Link href={menuHref} className="btn-primary mt-4 inline-block !rounded-xl">{t.tracking.browseMenu}</Link>
        </StateCard>
      );
    }
    if (connection) {
      return (
        <StateCard title={t.tracking.unreachableTitle}>
          <p>{t.tracking.connection[connection] ?? t.tracking.connection.network}</p>
          <button onClick={retry} className="btn-primary mt-4 inline-block !rounded-xl">{t.common.retry}</button>
        </StateCard>
      );
    }
    return <p className="font-body text-white/55">{t.tracking.loading}</p>;
  }

  const orders = [...(bill.orders ?? [])].sort((a, b) => String(a.opened_at).localeCompare(String(b.opened_at)));
  const billable = orders.filter((order) => order.status !== "cancelled");
  const allCancelled = orders.length > 0 && billable.length === 0;
  const canAddMore = ["open", "pay_requested", "paid"].includes(bill.status);
  const highlight = orderNumber && orders.find((order) => order.order_number === orderNumber);

  return (
    <>
      {cancelNotice && (
        <CancelledPopup
          notice={cancelNotice}
          onClose={() => setCancelNotice(null)}
          onNewOrder={() => { setCancelNotice(null); router.push(menuHref); }}
        />
      )}
      {banner && (
        // Big, impossible-to-miss notice under the navbar; tap to dismiss.
        <button
          type="button"
          onClick={() => setBanner(null)}
          role="alert"
          className={`fixed inset-x-3 top-20 z-50 mx-auto block max-w-xl rounded-2xl px-4 py-3 text-start font-body shadow-[0_12px_30px_rgba(0,0,0,0.55)] md:top-24 ${
            banner.kind === "ready" ? "bg-brand-gold text-brand-black" : banner.kind === "paid" ? "bg-emerald-600 text-white" : "bg-brand-red text-white"
          }`}
        >
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">{banner.orderNumber || t.tracking.yourOrder}</span>
          <span className="block font-display text-2xl tracking-wide">{banner.title}</span>
          {banner.description && <span className="block text-sm opacity-90">{banner.description}</span>}
        </button>
      )}
      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-gold sm:text-xs">
        {highlight ? t.tracking.orderNumber(highlight.order_number) : t.tracking.yourTable}
      </p>
      <h1 className="mb-4 mt-0.5 font-display text-3xl tracking-wide text-white sm:mb-6 sm:text-4xl">{allCancelled ? t.tracking.cancelledHeading : t.tracking.statusHeading}</h1>

      {connection && (
        <div role="status" className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-brand-black-soft p-3 font-body text-xs text-white/65">
          <span>{t.tracking.connection[connection] ?? t.tracking.connection.network} {t.tracking.showingLast}</span>
          <button onClick={retry} className="shrink-0 font-semibold uppercase tracking-wide text-brand-gold underline">{t.common.retry}</button>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => <OrderCard key={order.id} order={order} />)}
      </div>

      {!allCancelled && (
        <div className="fade-up-in mt-5 rounded-xl border border-white/10 bg-brand-black-soft p-4 font-body text-sm">
          <Row label={t.common.total} value={money(Number(bill.total))} strong />
          <Row label={t.common.paidSoFar} value={money(Number(bill.amount_paid ?? 0))} />
          <Row label={t.common.remaining} value={money(Number(bill.amount_outstanding ?? bill.total))} />
        </div>
      )}

      {allCancelled
        ? <Notice>{t.tracking.nothingToPay}</Notice>
        : <PaymentPanel tableCode={tableCode} bill={bill} />}

      {canAddMore && (
        <Link href={menuHref} className="btn-primary mt-4 block w-full !rounded-xl !py-3.5 text-center">{t.tracking.addMore}</Link>
      )}
      <p className="mt-4 text-center font-body text-xs text-white/40">
        {t.tracking.autoRefresh}
        {billable[0] ? t.tracking.otherPhone(billable[0].order_number) : ""}
      </p>
    </>
  );
}

function CancelledPopup({ notice, onClose, onNewOrder }) {
  const { t } = useI18n();
  const numbers = notice.orderNumbers.filter(Boolean).join(", ");
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="cancelled-title" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-red/40 bg-brand-black-soft p-6 text-center font-body shadow-[0_12px_30px_rgba(0,0,0,0.55)]">
        <h2 id="cancelled-title" className="font-display text-2xl tracking-wide text-brand-red">{t.tracking.cancelledHeading}</h2>
        <p className="mt-2 text-sm text-white/75">{t.tracking.cancelledPopup(numbers)}</p>
        {notice.allCancelled ? (
          <>
            <button type="button" onClick={onNewOrder} className="btn-primary mt-5 block w-full !rounded-xl !py-3">{t.tracking.startNew}</button>
            <button type="button" onClick={onClose} className="mt-3 text-xs text-white/60 underline">{t.common.close}</button>
          </>
        ) : (
          <button type="button" onClick={onClose} className="btn-primary mt-5 block w-full !rounded-xl !py-3">{t.common.ok}</button>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const { t, money } = useI18n();
  const [title, description] = t.tracking.states[order.status] ?? [t.tracking.inProgress, ""];
  const cancelled = order.status === "cancelled";
  // One list: a dish added later joins its row (see lib/orderLines.js), it
  // does not start a separate "added later" list.
  const groups = groupLines(order.items ?? []);
  return (
    <section className={`fade-up-in rounded-xl border bg-brand-black-soft p-4 ${cancelled ? "border-brand-red/30" : "border-white/10"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{order.order_number}</p>
          <h2 className={`mt-0.5 font-display text-xl tracking-wide sm:text-2xl ${cancelled ? "text-brand-red" : "text-white"}`}>{title}</h2>
          {description && <p className="mt-1 font-body text-sm text-white/60">{description}</p>}
        </div>
        {!cancelled && <span className="font-body text-sm font-semibold text-brand-gold">{money(Number(order.total))}</span>}
      </div>
      {!cancelled && groups.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
          {groups.map((group) => <Line key={group.key} group={group} />)}
        </div>
      )}
    </section>
  );
}

function Line({ group }) {
  const { t, locale, money } = useI18n();
  const item = group.lines[0];
  const name = pick(locale, item.name_en, item.name_ar);
  const variant = pick(locale, item.variant_name_en, item.variant_name_ar);
  const status = sharedStatus(group);
  const labelOf = (value) => t.lines[value] ?? t.lines.pending;
  return (
    <div className={`flex items-center justify-between gap-3 font-body text-sm ${status === "served" ? "text-white/45" : "text-white/75"}`}>
      <span>{group.quantity}× {name}{variant ? ` (${variant})` : ""}</span>
      <span className="flex items-center gap-3">
        <span className="rounded bg-white/5 px-2 py-0.5 text-end text-[11px] font-semibold uppercase tracking-wide text-white/60">
          {status ? labelOf(status) : statusBreakdown(group, labelOf)}
        </span>
        <span className="tabular-nums">{money(group.total)}</span>
      </span>
    </div>
  );
}

function PaymentPanel({ tableCode, bill }) {
  const { t, money } = useI18n();
  const payHref = `/t/${encodeURIComponent(tableCode)}/pay?bill_id=${encodeURIComponent(bill.id)}`;
  const amount = money(Number(bill.amount_outstanding ?? bill.total));

  if (bill.status === "paid") {
    return (
      <div className="mt-5 rounded-xl border border-brand-gold/30 bg-brand-black-soft p-4 text-center font-body text-sm text-brand-gold">
        <p className="font-display text-xl tracking-wide sm:text-2xl">{t.tracking.paymentDone}</p>
        <Link href={payHref} className="mt-2 inline-block text-xs text-white/65 underline">{t.tracking.viewReceipt}</Link>
      </div>
    );
  }
  if (bill.status === "pay_requested" && bill.requested_method === "cash") {
    return (
      <div className="mt-5 rounded-xl border border-brand-gold/30 bg-brand-black-soft p-4 text-center font-body text-sm text-white/75">
        <p className="font-display text-xl tracking-wide text-white sm:text-2xl">{t.tracking.waitingCash}</p>
        <p className="mt-1">{t.tracking.haveReady(amount)}</p>
        <Link href={payHref} className="mt-2 inline-block text-xs text-brand-gold underline">{t.tracking.changeMethod}</Link>
      </div>
    );
  }
  if (bill.status === "pay_requested") {
    return (
      <div className="mt-5 rounded-xl border border-brand-gold/30 bg-brand-black-soft p-4 text-center font-body text-sm text-white/75">
        <p className="font-display text-xl tracking-wide text-white sm:text-2xl">{t.tracking.onlineInProgress}</p>
        <p className="mt-1">{t.tracking.onlineInProgressBody}</p>
        <Link href={payHref} className="btn-primary mt-3 inline-block !rounded-xl">{t.tracking.continuePayment(amount)}</Link>
      </div>
    );
  }
  return (
    <>
      {bill.payment_request_cancelled_by_add && <Notice>{t.tracking.itemsAdded}</Notice>}
      {bill.ready_to_pay ? (
        <Link href={payHref} className="btn-primary mt-5 block w-full !rounded-xl !py-3.5 text-center">{t.tracking.payCashOrOnline(amount)}</Link>
      ) : (
        <div className="mt-5 text-center">
          <button disabled className="btn-primary w-full cursor-not-allowed !rounded-xl !py-3.5 opacity-50">{t.tracking.pay(amount)}</button>
          <p className="mt-2 font-body text-xs text-white/50">{t.tracking.payAfterServed}</p>
        </div>
      )}
    </>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between py-0.5 ${strong ? "font-semibold text-white" : "text-white/60"}`}>
      <span>{label}</span>
      <span className={strong ? "text-brand-gold" : ""}>{value}</span>
    </div>
  );
}

function Notice({ children }) {
  return <p className="mt-5 rounded-xl border border-brand-gold/25 bg-brand-black-soft p-4 font-body text-sm text-white/75">{children}</p>;
}

function StateCard({ title, children }) {
  return (
    <section className="rounded-xl border border-white/10 bg-brand-black-soft p-6 text-center font-body text-sm text-white/70">
      <h1 className="mb-3 font-display text-2xl tracking-wide text-white sm:text-3xl">{title}</h1>
      {children}
    </section>
  );
}
