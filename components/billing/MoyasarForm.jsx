"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useI18n } from "@/context/LocaleContext";

/**
 * Mounts Moyasar's hosted payment form.
 *
 * Card data never touches this app or our backend — the form posts it
 * straight to Moyasar, and all we ever see afterwards is a payment id we then
 * verify server-side.
 *
 * Every value here comes from the backend's request-pay response: the amount
 * in halalas, the publishable key, the callback URL and the description. None
 * of it is computed in the browser, so a customer editing the page cannot
 * change what they are charged — and the backend re-checks the amount against
 * the bill again during verification regardless.
 */

// Pinned, not a floating tag: a CDN publish must never be able to change
// checkout without a commit here. 2.3.0 is current as of this integration.
const MOYASAR_VERSION = "2.3.0";
const MOYASAR_JS = `https://cdn.jsdelivr.net/npm/moyasar-payment-form@${MOYASAR_VERSION}/dist/moyasar.umd.min.js`;
const MOYASAR_CSS = `https://cdn.jsdelivr.net/npm/moyasar-payment-form@${MOYASAR_VERSION}/dist/moyasar.css`;

export default function MoyasarForm({ bill, publishableKey, callbackUrl, description, onFailure }) {
  const { t, locale } = useI18n();
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  // Moyasar.init() is not idempotent — calling it twice renders two forms into
  // the same element. React 19 Strict Mode runs effects twice in development,
  // so this guard is what keeps that from happening.
  const initialised = useRef(false);

  useEffect(() => {
    if (!scriptReady || initialised.current) return;
    if (typeof window === "undefined" || !window.Moyasar) return;
    initialised.current = true;

    window.Moyasar.init({
      element: ".mysr-form",
      // Integer halalas, straight from the server. 1 SAR = 100 halalas.
      amount: bill.total_halalas,
      currency: bill.currency,
      description,
      publishable_api_key: publishableKey,
      callback_url: callbackUrl,
      methods: ["creditcard", "stcpay"],
      supported_networks: ["visa", "mastercard", "mada"],
      // The backend reads metadata.bill_id back off the VERIFIED payment to
      // decide which bill was paid. It must match the bill, or the payment is
      // flagged for manual review rather than settling anything.
      metadata: {
        bill_id: String(bill.id),
        payment_request_at: String(bill.pay_requested_at ?? ""),
      },
      // Moyasar ships its own English and Arabic form text.
      language: locale === "ar" ? "ar" : "en",
      // MUST be `async`. Moyasar's config validator rejects a plain function
      // outright — it checks `constructor.name === "AsyncFunction"` or that
      // the source starts with "async", and throws otherwise, which the form
      // catches and renders as "Form configuration issue!". A non-async
      // handler never even reaches the card fields.
      on_failure: async (error) => {
        // The bill stays pay_requested, so the customer can simply try again
        // or switch to cash without a staff member unlocking anything.
        onFailure?.(typeof error === "string" ? error : t.pay.declined);
      },
    });
  }, [scriptReady, bill, publishableKey, callbackUrl, description, onFailure, locale, t]);

  return (
    <>
      <link rel="stylesheet" href={MOYASAR_CSS} />
      <Script
        src={MOYASAR_JS}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setScriptFailed(true)}
      />

      {scriptFailed ? (
        <p className="rounded-xl border border-brand-red/40 bg-brand-red/10 p-4 font-body text-sm text-white/80">
          {t.pay.formFailed}
        </p>
      ) : null}

      {!scriptReady && !scriptFailed ? (
        <p className="rounded-xl border border-white/10 bg-brand-black-soft p-4 text-center font-body text-sm text-white/55">
          {t.pay.formLoading}
        </p>
      ) : null}

      {/* Moyasar renders into this element. Styling is theirs, not ours. */}
      <div className="mysr-form" />
    </>
  );
}
