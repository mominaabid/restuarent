"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/components/CartContext";
import { MENU_ITEMS } from "@/components/menuData";

const DELIVERY_FEE = 2.5;
const TAX_RATE = 0.05;
const money = (amount) => `$${amount.toFixed(2)}`;

export default function CartPage() {
  const { cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const tax = cartTotal * TAX_RATE;
  const grandTotal = cartTotal + tax + (cartItems.length ? DELIVERY_FEE : 0);
  const recommendations = MENU_ITEMS.filter((item) => !cartItems.some((cartItem) => cartItem.id === item.id)).slice(0, 4);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-brand-black px-6 pb-16 pt-32 md:px-10 md:pb-20 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.35em] text-brand-gold">Your flame-grilled order</p>
              <h1 className="mt-2 font-display text-5xl tracking-wide text-white md:text-7xl">YOUR <span className="text-brand-red">CART</span></h1>
            </div>
            {cartItems.length > 0 && <button onClick={clearCart} className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-brand-red">Clear cart</button>}
          </div>

          {cartItems.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="space-y-4">
                {cartItems.map((item) => (
                  <article key={item.id} className="cart-item group grid grid-cols-[88px_1fr] gap-4 rounded-2xl border border-white/10 bg-brand-black-soft p-4 transition-all duration-300 hover:border-brand-red/50 sm:grid-cols-[140px_1fr_auto] sm:items-center sm:gap-6 sm:p-5">
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-black"><Image src={item.image} alt={item.name} fill sizes="140px" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                    <div>
                      <p className="font-body text-[10px] uppercase tracking-[0.25em] text-brand-gold">{item.category}</p>
                      <h2 className="mt-1 font-display text-2xl tracking-wide text-white sm:text-3xl">{item.name}</h2>
                      <p className="mt-1 font-body text-sm text-white/50">{item.price} each</p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-white/15 bg-black/30">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`} className="h-9 w-9 text-lg text-white/70 transition-colors hover:text-brand-gold">−</button>
                          <span className="w-7 text-center font-body text-sm font-semibold text-white">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`} className="h-9 w-9 text-lg text-white/70 transition-colors hover:text-brand-gold">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="font-body text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35 transition-colors hover:text-brand-red">Remove</button>
                      </div>
                    </div>
                    <strong className="col-start-2 font-display text-3xl tracking-wide text-brand-gold sm:col-auto sm:text-right">{money(Number(item.price.replace(/[^0-9.]/g, "")) * item.quantity)}</strong>
                  </article>
                ))}
              </section>
              <OrderSummary subtotal={cartTotal} tax={tax} grandTotal={grandTotal} />
            </div>
          )}

          <section className="mt-14 border-t border-white/10 pt-10 md:mt-16">
            <div className="mb-6 flex items-end justify-between gap-4"><div><p className="font-body text-xs uppercase tracking-[0.28em] text-brand-gold">Keep the fire going</p><h2 className="mt-1 font-display text-4xl tracking-wide text-white">YOU MIGHT ALSO LIKE</h2></div><Link href="/#menu" className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-white/50 transition-colors hover:text-brand-red">View menu →</Link></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((item) => <Recommendation key={item.id} item={item} onAdd={() => addToCart(item)} />)}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function EmptyCart() {
  return <section className="rounded-3xl border border-dashed border-white/15 bg-brand-black-soft px-6 py-20 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/15 text-3xl text-brand-red">♨</div><h2 className="mt-6 font-display text-4xl tracking-wide text-white">YOUR GRILL IS EMPTY</h2><p className="mx-auto mt-3 max-w-md font-body text-white/55">Pick something bold from the menu and we&apos;ll keep it ready for your order.</p><Link href="/#menu" className="btn-primary mt-7 inline-block">Browse menu</Link></section>;
}

function OrderSummary({ subtotal, tax, grandTotal }) {
  return <aside className="h-fit rounded-2xl border border-brand-red/30 bg-[linear-gradient(145deg,#1b1112,#0d0d0d)] p-6 shadow-[0_0_45px_rgba(224,32,42,0.12)] lg:sticky lg:top-28"><p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">Order summary</p><h2 className="mt-2 font-display text-4xl tracking-wide text-white">THE DAMAGE</h2><div className="mt-7 space-y-4 border-y border-white/10 py-5 font-body text-sm text-white/60"><SummaryRow label="Subtotal" value={money(subtotal)} /><SummaryRow label="Delivery" value={money(DELIVERY_FEE)} /><SummaryRow label="Tax (5%)" value={money(tax)} /></div><div className="mt-5 flex items-end justify-between"><span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Total</span><strong className="font-display text-4xl tracking-wide text-brand-gold">{money(grandTotal)}</strong></div><button onClick={() => window.alert("Checkout is coming soon — your cart is saved.")} className="btn-primary mt-7 w-full !rounded-xl">Proceed to checkout →</button><p className="mt-4 text-center font-body text-[11px] text-white/35">Taxes and delivery are calculated live.</p></aside>;
}

function SummaryRow({ label, value }) { return <div className="flex justify-between"><span>{label}</span><span className="text-white">{value}</span></div>; }

function Recommendation({ item, onAdd }) {
  return <article className="group flex items-center gap-3 rounded-xl border border-white/10 bg-brand-black-soft p-3 transition-all hover:border-brand-gold/60"><div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg"><Image src={item.image} alt="" fill sizes="64px" className="object-cover" /></div><div className="min-w-0 flex-1"><h3 className="truncate font-display text-lg tracking-wide text-white">{item.name}</h3><p className="font-body text-sm text-brand-gold">{item.price}</p></div><button onClick={onAdd} className="rounded-full border border-brand-gold/60 px-3 py-1.5 font-body text-xs font-semibold uppercase text-brand-gold transition-all hover:bg-brand-gold hover:text-brand-black">+ Add</button></article>;
}
