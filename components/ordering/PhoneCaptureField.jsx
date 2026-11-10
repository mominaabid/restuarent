"use client";

import { useI18n } from "@/context/LocaleContext";

export default function PhoneCaptureField({ value, onChange, error, readOnly = false }) {
  const { t } = useI18n();
  return (
    <div>
      <label htmlFor="qr-phone" className="mb-1.5 block font-body text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
        {t.qrCart.phoneLabel} <span className="text-brand-red">*</span>
      </label>
      {readOnly ? (
        <p id="qr-phone" className="rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white">
          {t.qrCart.orderingAs} <bdi>•••• {value.slice(-4)}</bdi>
        </p>
      ) : <input
        id="qr-phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={t.qrCart.phonePlaceholder}
        dir="ltr"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-lg border bg-black/30 px-4 py-2.5 font-body text-sm text-white placeholder:text-white/30 focus:outline-none ${
          error ? "border-brand-red" : "border-white/15 focus:border-brand-gold"
        }`}
      />}
      <p className="mt-1.5 font-body text-[11px] text-white/40">
        {readOnly ? t.qrCart.phoneLocked : t.qrCart.phoneHelp}
      </p>
      {error && <p className="mt-1 font-body text-[11px] font-medium text-brand-red">{error}</p>}
    </div>
  );
}
