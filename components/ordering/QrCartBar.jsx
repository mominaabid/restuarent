"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/context/LocaleContext";

/** Short pulse whenever the cart grows, so an "Add" tap visibly lands. */
function useGrowPulse(count) {
  const [pulse, setPulse] = useState(false);
  const previous = useRef(count);
  useEffect(() => {
    const grew = count > previous.current;
    previous.current = count;
    if (!grew) return undefined;
    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), 450);
    return () => window.clearTimeout(timer);
  }, [count]);
  return pulse;
}

/**
 * Bottom bar on the QR menu: says exactly what is in the cart (item count and
 * total) the moment something is added, and opens the cart in one tap from
 * anywhere on a long menu. Hidden while the cart is empty.
 */
export default function QrCartBar({ tableCode }) {
  const { cartItems, cartCount, cartTotal, cartLoaded } = useCart();
  const { t, money } = useI18n();
  const pulse = useGrowPulse(cartCount);

  if (!cartLoaded || !cartItems.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <Link
        href={`/t/${encodeURIComponent(tableCode)}/cart`}
        className={`mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl bg-brand-red px-4 py-3 font-body text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-transform active:scale-[0.98] ${pulse ? "scale-[1.03]" : ""}`}
      >
        <span className="min-w-0">
          <span className="block text-sm font-bold">{t.qrMenu.viewCart}</span>
          <span className="block truncate text-[11px] text-white/85">
            {t.qrMenu.cartSummary(cartCount, cartItems.length)}
          </span>
        </span>
        <span className="flex flex-none items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-red">{cartCount}</span>
          <span className="text-sm font-bold">{money(cartTotal)}</span>
          <span aria-hidden="true">{t.common.arrowForward}</span>
        </span>
      </Link>
    </div>
  );
}

/** The header "Cart" button, with the live item count on it. */
export function QrCartLink({ tableCode }) {
  const { cartCount, cartLoaded } = useCart();
  const { t } = useI18n();
  const pulse = useGrowPulse(cartCount);
  const count = cartLoaded ? cartCount : 0;
  return (
    <Link
      href={`/t/${encodeURIComponent(tableCode)}/cart`}
      aria-label={t.qrMenu.cartAria(count)}
      className={`btn-primary relative !px-3.5 !py-2 !text-[11px] transition-transform active:scale-95 sm:!px-5 sm:!py-2.5 sm:!text-xs ${pulse ? "scale-110" : ""}`}
    >
      {t.qrMenu.cart}
      {count > 0 && (
        <span className="ms-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold leading-5 text-brand-red">
          {count}
        </span>
      )}
    </Link>
  );
}
