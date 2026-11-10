"use client";

import Image from "next/image";
import { apiErrorMessage, networkErrorMessage } from "@/lib/apiError";
import Link from "next/link";
import { useCart, lineKey } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { useI18n } from "@/context/LocaleContext";
import QrCartClient from "@/components/ordering/QrCartClient";
import { useLiveLimits } from "@/lib/useLiveLimits";

// products (for recommendations) comes from a Server Component that fetched
// them via lib/api — see app/cart/page.js. Never imports mock data directly.
export default function CartPageClient({ products, branchId }) {
  const { t, money } = useI18n();
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, activeTableCode, submissionKey } = useCart();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [stockNotice, setStockNotice] = useState("");
  const cartRef = useRef(cartItems);

  useEffect(() => {
    cartRef.current = cartItems;
  }, [cartItems]);

  // Same live stock check as the QR cart: lower anything now over the limit,
  // flag lines that are sold out, and block checkout until they are removed.
  // Skipped when a table is active — QrCartClient runs its own check then.
  const { limitFor } = useLiveLimits(null, (limitOf) => {
    const lowered = [];
    for (const line of cartRef.current) {
      const limit = limitOf(line);
      if (typeof limit === "number" && limit > 0 && line.quantity > limit) {
        updateQuantity(lineKey(line), limit);
        lowered.push(`${line.name} (${limit})`);
      }
    }
    setStockNotice(lowered.length ? t.cart.stockUpdated(lowered.join(t.common.listSep)) : "");
  }, activeTableCode ? "" : branchId);
  const soldOutLines = cartItems.filter((line) => limitFor(line) === 0);
  const recommendations = products.filter((item) => !cartItems.some((cartItem) => cartItem.id === item.id)).slice(0, 4);

  async function checkout() {
    setError("");
    if (phone.trim().length < 7 || !cartItems.length) { setError(t.cart.needPhone); return; }
    if (soldOutLines.length) { setError(t.cart.removeUnavailable); return; }
    setPending(true);
    try {
      const response = await fetch("/api/customer/orders", {
        method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": submissionKey },
        body: JSON.stringify({ request_id: submissionKey, phone: phone.trim(), items: cartItems.map((item) => ({
          product: Number(item.productId ?? item.id), ...(item.variantId ? { variant: Number(item.variantId) } : {}),
          quantity: item.quantity, notes: item.notes ?? "",
        })) }),
      });
      const result = await response.json().catch(() => ({}));
      // The server's own reason, worded for the customer — never a raw "error.*" code.
      if (!response.ok) throw new Error(apiErrorMessage(t, result, response.status, t.qrCart.errors, t.cart.couldNotPlace));
      sessionStorage.setItem(`order-phone:${result.order_number}`, phone.trim());
      clearCart();
      router.push(`/order/${encodeURIComponent(result.order_number)}`);
    } catch (cause) { setError(cause instanceof TypeError ? networkErrorMessage(t) : cause instanceof Error ? cause.message : t.cart.couldNotPlace); }
    finally { setPending(false); }
  }

  return (
    <main className="min-h-screen bg-brand-black px-6 pb-16 pt-32 md:px-10 md:pb-20 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold">{t.cart.kicker}</p>
            <h1 className="mt-2 font-display text-5xl tracking-wide text-white md:text-7xl">{t.cart.heading} <span className="text-brand-red">{t.cart.headingAccent}</span></h1>
          </div>
          {cartItems.length > 0 && <button onClick={clearCart} className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-brand-red">{t.cart.clear}</button>}
        </div>

        {activeTableCode ? (
          <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-brand-black-soft p-5 sm:p-7">
            <p className="mb-5 font-body text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">{t.cart.dineInCheckout}</p>
            <QrCartClient tableCode={activeTableCode} />
          </section>
        ) : cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-4">
              {cartItems.map((item) => (
                <article key={lineKey(item)} className={`cart-item group grid grid-cols-[88px_1fr] gap-4 rounded-2xl border bg-brand-black-soft ${limitFor(item) === 0 ? "border-brand-red/60" : "border-white/10"} p-4 transition-all duration-300 hover:border-brand-red/50 sm:grid-cols-[140px_1fr_auto] sm:items-center sm:gap-6 sm:p-5`}>
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-black"><Image src={item.image} alt={item.name} fill unoptimized sizes="140px" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                  <div>
                    <p className="font-body text-[10px] uppercase tracking-[0.25em] text-brand-gold">{item.categoryName}</p>
                    <h2 className="mt-1 font-display text-2xl tracking-wide text-white sm:text-3xl">{item.name}{item.variantName ? <small className="block text-sm text-brand-gold">{item.variantName}</small> : null}</h2>
                    <p className="mt-1 font-body text-sm text-white/50">{t.common.each(money(item.price))}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-white/15 bg-black/30">
                      <button onClick={() => updateQuantity(lineKey(item), item.quantity - 1)} aria-label={t.cart.decrease(item.name)} className="h-9 w-9 text-lg text-white/70 transition-colors hover:text-brand-gold">−</button>
                        <span className="w-7 text-center font-body text-sm font-semibold text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(lineKey(item), item.quantity + 1)} disabled={typeof limitFor(item) === "number" && item.quantity >= limitFor(item)} aria-label={t.cart.increase(item.name)} className="h-9 w-9 text-lg text-white/70 transition-colors hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-30">+</button>
                      </div>
                      <button onClick={() => removeFromCart(lineKey(item))} className="font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35 transition-colors hover:text-brand-red">{t.cart.remove}</button>
                      {limitFor(item) === 0 ? (
                        <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-brand-red">{t.cart.notAvailableRemove}</span>
                      ) : typeof limitFor(item) === "number" && item.quantity >= limitFor(item) ? (
                        <span className="font-body text-[11px] font-semibold uppercase tracking-wide text-brand-gold">{t.common.max(limitFor(item))}</span>
                      ) : null}
                    </div>
                  </div>
                  <strong className="col-start-2 font-display text-3xl tracking-wide text-brand-gold sm:col-auto sm:text-end">{money(item.price * item.quantity)}</strong>
                </article>
              ))}
            </section>
            <aside className="h-fit rounded-2xl border border-brand-red/30 bg-[linear-gradient(145deg,#1b1112,#0d0d0d)] p-6 lg:sticky lg:top-28">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">{t.cart.summary}</p>
              <div className="mt-5 flex justify-between border-y border-white/10 py-5 font-body text-white/60"><span>{t.cart.estimatedTotal}</span><strong className="text-brand-gold">{money(cartTotal)}</strong></div>
              <label className="mt-5 block font-body text-xs uppercase tracking-wide text-white/60">{t.cart.phone}<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel" className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-white" /></label>
              {stockNotice && <p role="status" className="mt-3 rounded-lg border border-brand-gold/30 p-3 text-xs text-brand-gold">{stockNotice}</p>}
              {soldOutLines.length > 0 && (
                <p role="alert" className="mt-3 rounded-lg border border-brand-red/40 bg-brand-red/10 p-3 text-xs text-white/85">
                  {t.cart.soldOut(soldOutLines.map((line) => line.name).join(t.common.listSep), soldOutLines.length)}
                </p>
              )}
              {error && <p role="alert" className="mt-3 text-sm text-brand-red">{error}</p>}
              <button onClick={checkout} disabled={pending || soldOutLines.length > 0} className="btn-primary mt-5 w-full disabled:opacity-50">{pending ? t.cart.submitting : t.cart.placeOrder}</button>
              <p className="mt-3 text-xs text-white/40">{t.cart.confirmNote}</p>
            </aside>
          </div>
        )}

        {!activeTableCode && <section className="mt-14 border-t border-white/10 pt-10 md:mt-16">
          <div className="mb-6 flex items-end justify-between gap-4"><div><p className="font-body text-xs uppercase tracking-[0.28em] text-brand-gold">{t.cart.keepGoing}</p><h2 className="mt-1 font-display text-4xl tracking-wide text-white">{t.product.youMightLike}</h2></div><Link href="/menu" className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/50 transition-colors hover:text-brand-red">{t.cart.viewMenu} {t.common.arrowForward}</Link></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((item) => <Recommendation key={item.id} item={item} onAdd={() => addToCart(item)} t={t} money={money} />)}
          </div>
        </section>}
      </div>
    </main>
  );
}

function EmptyCart() {
  const { t } = useI18n();
  return <section className="rounded-3xl border border-dashed border-white/15 bg-brand-black-soft px-6 py-20 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/15 text-3xl text-brand-red">♨</div><h2 className="mt-6 font-display text-4xl tracking-wide text-white">{t.cart.emptyTitle}</h2><p className="mx-auto mt-3 max-w-md font-body text-white/55">{t.cart.emptyBody}</p><Link href="/menu" className="btn-primary mt-7 inline-block">{t.common.browseMenu}</Link></section>;
}

function OrderSummary({ subtotal }) {
  const money = formatCurrency;
  return <aside className="h-fit rounded-2xl border border-brand-red/30 bg-[linear-gradient(145deg,#1b1112,#0d0d0d)] p-6 shadow-[0_0_45px_rgba(224,32,42,0.12)] lg:sticky lg:top-28"><p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">Order summary</p><h2 className="mt-2 font-display text-4xl tracking-wide text-white">TOTAL</h2><div className="mt-7 border-y border-white/10 py-5 font-body text-sm text-white/60"><SummaryRow label="Subtotal" value={money(subtotal)} /></div><div className="mt-5 flex items-end justify-between"><span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Total</span><strong className="font-display text-4xl tracking-wide text-brand-gold">{money(subtotal)}</strong></div><button disabled className="btn-primary mt-7 w-full !rounded-xl cursor-not-allowed opacity-60">Scan a table QR to order</button><p className="mt-4 text-center font-body text-[11px] text-white/45">Dine-in checkout needs the QR code at your table.</p></aside>;
}

function SummaryRow({ label, value }) { return <div className="flex justify-between"><span>{label}</span><span className="text-white">{value}</span></div>; }

function Recommendation({ item, onAdd, t, money }) {
  const action = item.variants?.length ? <Link href={`/menu/${item.id}`} className="rounded-full border border-brand-gold/60 px-3 py-1.5 font-body text-xs font-semibold uppercase text-brand-gold">{t.cart.choose}</Link> : <button onClick={onAdd} disabled={!item.isOrderable} className="rounded-full border border-brand-gold/60 px-3 py-1.5 font-body text-xs font-semibold uppercase text-brand-gold disabled:opacity-40">{t.cart.add}</button>;
  return <article className="group flex items-center gap-3 rounded-xl border border-white/10 bg-brand-black-soft p-3 transition-all hover:border-brand-gold/60"><div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg"><Image src={item.image} alt="" fill unoptimized sizes="64px" className="object-cover" /></div><div className="min-w-0 flex-1"><h3 className="truncate font-display text-lg tracking-wide text-white">{item.name}</h3><p className="font-body text-sm text-brand-gold">{money(item.price)}</p></div>{action}</article>;
}
