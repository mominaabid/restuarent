"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useI18n } from "@/context/LocaleContext";
import { pick } from "@/lib/i18n/config";

export default function CustomerOrderPage() {
  const { orderCode } = useParams();
  const { t, locale } = useI18n();
  // The polling loop reads messages through a ref so a language switch doesn't restart it.
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    const savedPhone = sessionStorage.getItem(`order-phone:${orderCode}`) || "";
    setPhone(savedPhone);
    setPhoneInput(savedPhone);
  }, [orderCode]);

  useEffect(() => {
    if (!orderCode || !phone) return;
    let active = true;
    let timer;
    const refresh = async () => {
      try {
        const query = new URLSearchParams({ order_code: String(orderCode), phone });
        const response = await fetch(`/api/customer/orders?${query}`, { cache: "no-store" });
        const result = await response.json().catch(() => ({}));
        if (response.status === 429) throw new Error(tRef.current.orderLookup.tooMany);
        if (response.status === 404) throw new Error(tRef.current.orderLookup.notFound);
        if (!response.ok) throw new Error(tRef.current.orderLookup.unavailableRetrying);
        if (active) { setOrder(result); setError(""); }
      } catch (cause) { if (active) setError(cause.message || tRef.current.orderLookup.unavailable); }
      if (active) timer = window.setTimeout(refresh, 8000);
    };
    void refresh();
    return () => { active = false; window.clearTimeout(timer); };
  }, [orderCode, phone]);

  const submitPhone = (event) => {
    event.preventDefault();
    const value = phoneInput.trim();
    if (value.length < 7) return;
    sessionStorage.setItem(`order-phone:${orderCode}`, value);
    setError("");
    setPhone(value);
  };
  const lineLabel = (status) => t.lines[status] || t.lines.pending;

  return <><Navbar /><main className="min-h-screen bg-brand-black px-6 pb-20 pt-32 text-white"><div className="mx-auto max-w-3xl">
    <p className="font-body text-xs uppercase tracking-[0.25em] text-brand-gold">{t.orderLookup.kicker}</p>
    <h1 className="mt-2 font-display text-5xl">{order?.order_number || decodeURIComponent(String(orderCode))}</h1>
    {!phone && <form onSubmit={submitPhone} className="mt-6 max-w-md rounded-xl border border-white/10 p-4"><label htmlFor="tracking-phone" className="block text-sm text-white/70">{t.orderLookup.enterPhone}</label><input id="tracking-phone" type="tel" dir="ltr" autoComplete="tel" value={phoneInput} onChange={(event) => setPhoneInput(event.target.value)} className="mt-3 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-white" /><button className="btn-primary mt-3 w-full !rounded-xl !py-3">{t.orderLookup.view}</button></form>}
    {error && <p role="alert" className="mt-6 rounded-xl border border-brand-red/40 p-4 text-white/75">{error}</p>}
    {!order && !error && <p className="mt-8 text-white/60">{t.orderLookup.loading}</p>}
    {order && <><p className="mt-6 text-lg">{t.orderLookup.status}: <strong className="text-brand-gold">{t.orderLookup.statuses[order.status] ?? order.status.replaceAll("_", " ")}</strong></p>
      <ul className="mt-6 divide-y divide-white/10 rounded-xl border border-white/10">{order.items.filter((item) => item.status !== "voided").map((item) => <li key={item.id} className="flex justify-between gap-3 p-4"><span>{item.quantity} × {pick(locale, item.name_en_snapshot, item.name_ar_snapshot)}{item.variant_name_en_snapshot || item.variant_name_ar_snapshot ? ` · ${pick(locale, item.variant_name_en_snapshot, item.variant_name_ar_snapshot)}` : ""}{item.is_new && <small className="ms-2 text-brand-gold">{t.orderLookup.newBadge}</small>}</span><span className="text-white/55">{lineLabel(item.status)}</span></li>)}</ul>
      <p className="mt-5 text-sm text-white/50">{t.orderLookup.autoRefresh}</p>
    </>}
  </div></main><Footer /></>;
}
