"use client";

import { useState } from "react";
import { useI18n } from "@/context/LocaleContext";
import { printSlip } from "@/lib/printSlip";

/**
 * Download and share for the customer's tax invoice.
 *
 * "Download" opens the print dialog with only the invoice slip, at 80mm
 * (lib/printSlip.js), where phones and desktops both offer "Save as PDF".
 * "Share" sends the invoice's own page (/receipt/<uuid>): the UUID is random
 * and only ever reaches the paying customer, and that page shows simplified
 * invoices only, never a company's.
 */
export default function InvoiceActions({ invoice }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  if (!invoice) return null;

  function download() {
    printSlip(".tax-invoice");
  }

  async function share() {
    const url = `${window.location.origin}/receipt/${encodeURIComponent(invoice.uuid)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: t.invoice.shareTitle, text: invoice.number, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // The customer closed the share sheet; nothing to do.
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 print:hidden">
      <button type="button" onClick={download} className="btn-primary">{t.invoice.download}</button>
      <button type="button" onClick={() => void share()} className="btn-outline">
        {copied ? t.invoice.linkCopied : t.invoice.share}
      </button>
    </div>
  );
}
