"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/context/LocaleContext";
import TaxInvoices from "@/components/billing/TaxInvoice";
import InvoiceActions from "@/components/billing/InvoiceActions";
import { apiErrorMessage } from "@/lib/apiError";

/**
 * What the customer sees after Moyasar sends them back from 3DS / STC Pay.
 *
 * Moyasar appends ?id=, ?status= and ?message= to the callback URL. We read
 * ONLY the id, and post it to our backend, which re-fetches the payment from
 * Moyasar's API and decides for itself. `status` is attacker-editable — a
 * customer could change it to "paid" in the address bar — so it is never
 * read here or sent onward.
 *
 * If this verification fails for any reason (closed tab, flaky network, the
 * customer never returning at all), Moyasar's webhook settles the bill
 * server-to-server anyway. This screen is a fast path for the diner's
 * reassurance, not the mechanism that makes payment reliable.
 */

const RETRY_MS = 3000;
const MAX_ATTEMPTS = 5;

export default function PayCallbackClient({ paymentId, tableCode, billId }) {
  const { t } = useI18n();
  // The verify loop below runs once; read the current language through a ref.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const [state, setState] = useState(paymentId && tableCode ? "verifying" : "missing");
  const [message, setMessage] = useState("");
  // The tax invoice(s) the settlement issued, from the verified bill.
  const [invoices, setInvoices] = useState([]);
  const started = useRef(false);

  useEffect(() => {
    if (state !== "verifying" || started.current) return;
    started.current = true;

    let cancelled = false;
    let attempts = 0;

    async function verify() {
      attempts += 1;
      try {
        const response = await fetch("/api/qr/bill/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_token: tableCode, payment_id: paymentId }),
        });
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (response.ok) {
          const settled = payload.result === "settled" || payload.result === "already_processed"
            || payload.status === "paid" || payload.status === "closed";
          if (settled) {
            setInvoices(Array.isArray(payload.invoices) ? payload.invoices.filter((doc) => doc.kind === "invoice") : []);
            return setState("paid");
          }
          if (payload.result === "needs_review") {
            setMessage(tRef.current.callback.reviewBody);
            return setState("review");
          }
          // "failed": declined, insufficient funds, 3DS abandoned. The bill is
          // still pay_requested, so trying again needs no staff involvement.
          return setState("failed");
        }

        // The webhook may simply not have landed yet. Retry a few times before
        // telling the customer anything is wrong.
        if (response.status >= 500 && attempts < MAX_ATTEMPTS) {
          return window.setTimeout(verify, RETRY_MS);
        }
        setMessage(apiErrorMessage(tRef.current, payload, response.status, tRef.current.callback.errors, ""));
        setState("failed");
      } catch {
        if (cancelled) return;
        if (attempts < MAX_ATTEMPTS) return window.setTimeout(verify, RETRY_MS);
        setMessage(tRef.current.callback.deviceFailed);
        setState("failed");
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [state, paymentId, tableCode]);

  const backToTable = tableCode
    ? `/t/${encodeURIComponent(tableCode)}/pay${billId ? `?bill_id=${encodeURIComponent(billId)}` : ""}`
    : "/";

  if (state === "missing") {
    return (
      <Panel tone="neutral" title={t.callback.missingTitle}>
        <p>{t.callback.missingBody}</p>
        <Action href={backToTable}>{t.callback.backToBill}</Action>
      </Panel>
    );
  }

  if (state === "verifying") {
    return (
      <Panel tone="neutral" title={t.callback.verifyingTitle}>
        <p>{t.callback.verifyingBody}</p>
      </Panel>
    );
  }

  if (state === "paid") {
    return (
      <div className="space-y-6">
        <Panel tone="good" title={t.callback.paidTitle}>
          <p>{t.callback.paidBody}</p>
          {invoices.length === 0 && <p>{t.invoice.preparing}</p>}
          <Action href={backToTable}>{t.callback.viewBill}</Action>
        </Panel>
        {invoices.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-center font-display text-2xl tracking-wide text-white print:hidden">{t.invoice.yourInvoice}</h2>
            <TaxInvoices invoices={invoices} />
            <InvoiceActions invoice={invoices[invoices.length - 1]} />
          </section>
        )}
      </div>
    );
  }

  if (state === "review") {
    return (
      <Panel tone="warn" title={t.callback.reviewTitle}>
        <p>{message}</p>
        <Action href={backToTable}>{t.callback.backToBill}</Action>
      </Panel>
    );
  }

  return (
    <Panel tone="bad" title={t.callback.failedTitle}>
      <p>{message || t.callback.failedBody}</p>
      <Action href={backToTable}>{t.callback.tryAgain}</Action>
    </Panel>
  );
}

const TONES = {
  neutral: "border-white/15",
  good: "border-brand-gold/40",
  warn: "border-brand-gold/40",
  bad: "border-brand-red/40",
};

function Panel({ tone, title, children }) {
  return (
    <div className={`fade-up-in rounded-2xl border ${TONES[tone]} bg-brand-black-soft p-7 text-center`}>
      <h1 className={`font-display text-3xl tracking-wide ${tone === "good" ? "text-brand-gold" : "text-white"}`}>
        {title}
      </h1>
      <div className="mt-3 space-y-4 font-body text-sm text-white/65">{children}</div>
    </div>
  );
}

function Action({ href, children }) {
  return (
    <Link href={href} className="btn-primary mt-2 inline-block">
      {children}
    </Link>
  );
}
