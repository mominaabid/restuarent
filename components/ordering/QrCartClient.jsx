"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useCart, lineKey } from "@/context/CartContext";
import { useI18n } from "@/context/LocaleContext";
import PhoneCaptureField from "@/components/ordering/PhoneCaptureField";
import { pinBill } from "@/lib/billPin";
import { forgetTablePhone, getTablePhone, setTablePhone } from "@/lib/customerPhone";
import { useLiveLimits } from "@/lib/useLiveLimits";
import { apiErrorMessage, networkErrorMessage } from "@/lib/apiError";

export default function QrCartClient({ tableCode }) {
  const router = useRouter();
  const { t, money } = useI18n();
  const { cartItems, updateQuantity, removeFromCart, cartTotal, submissionKey, cartLoaded, updateItemNotes, clearCart } = useCart();
  const [phone, setPhone] = useState("");
  const [access, setAccess] = useState(null);
  const [sessionFailed, setSessionFailed] = useState(false);
  const [phoneLoaded, setPhoneLoaded] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [stockNotice, setStockNotice] = useState("");
  const listRef = useRef(null);
  const cartRef = useRef(cartItems);

  useEffect(() => {
    cartRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const saved = getTablePhone(tableCode);
      // A saved number is only this guest's while it still has an unreleased
      // bill here; otherwise it belongs to an earlier party, so forget it
      // instead of filling it in for whoever scans next.
      let keep = false;
      if (saved) {
        try {
          const query = new URLSearchParams({ token: tableCode, phone: saved });
          const response = await fetch(`/api/qr/session?${query}`, { cache: "no-store", signal: controller.signal });
          // Service unreachable: keep it — the backend still checks the number on every order.
          keep = response.ok ? Boolean((await response.json()).bill_id) : response.status !== 404;
        } catch {
          if (controller.signal.aborted) return;
          keep = true;
        }
        if (!keep) forgetTablePhone(tableCode);
      }
      setPhone(keep ? saved : "");
      setPhoneLocked(keep);
      setPhoneLoaded(true);
    }, 0);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [tableCode]);

  useEffect(() => {
    if (!phoneLoaded) return;
    const controller = new AbortController();
    async function check() {
      try {
        const query = new URLSearchParams({ token: tableCode, phone });
        const response = await fetch(`/api/qr/session?${query}`, { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("session");
        const body = await response.json();
        if (controller.signal.aborted) return;
        setAccess({ ...body, checkedPhone: phone, checkedTable: tableCode });
        // Locked for as long as this number has an unreleased bill here —
        // open, awaiting payment or already paid — so an addition after paying
        // can never be placed under a different number.
        setPhoneLocked(Boolean(body.bill_id));
        setSessionFailed(false);
      } catch {
        if (!controller.signal.aborted) { setAccess(null); setSessionFailed(true); }
      }
    }
    const delay = setTimeout(check, 300);
    const timer = setInterval(check, 5000);
    return () => { controller.abort(); clearTimeout(delay); clearInterval(timer); };
  }, [tableCode, phone, phoneLoaded]);

  const accessBlocked = !access || access.checkedPhone !== phone || access.checkedTable !== tableCode || access.can_order === false;

  // Live limits from the current menu: lower anything now over the limit and
  // say so — never silently, never past what the kitchen can make.
  const { limitFor } = useLiveLimits(tableCode, (limitOf) => {
    const lowered = [];
    for (const line of cartRef.current) {
      const limit = limitOf(line);
      if (typeof limit === "number" && limit > 0 && line.quantity > limit) {
        updateQuantity(lineKey(line), limit);
        lowered.push(`${line.name} (${limit})`);
      }
    }
    setStockNotice(lowered.length ? t.cart.stockUpdated(lowered.join(t.common.listSep)) : "");
  });
  const soldOutLines = cartItems.filter((line) => limitFor(line) === 0);

  useEffect(() => {
    if (!cartItems.length) return undefined;
    const rows = gsap.utils.toArray(".qr-cart-row", listRef.current);
    const ctx = gsap.context(() => {
      gsap.fromTo(rows, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.06 });
    }, listRef);
    return () => ctx.revert();
  }, [cartItems.length]);

  async function handleSubmit() {
    setError("");
    if (accessBlocked) return;
    if (phone.trim().length < 7) {
      setError(t.qrCart.invalidPhone);
      return;
    }
    if (!cartItems.length) {
      setError(t.qrCart.cartEmpty);
      return;
    }
    if (!navigator.geolocation) {
      setError(t.qrCart.noGeo);
      return;
    }
    setIsPending(true);
    navigator.geolocation.getCurrentPosition(async ({ coords, timestamp }) => {
        try {
          const response = await fetch("/api/qr/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              request_id: submissionKey,
              session_token: tableCode,
              phone: phone.trim(),
              items: cartItems.map((item) => ({
                product: Number(item.id),
                // Omitted entirely for single-price items, which the backend
                // treats exactly as it did before variants existed.
                ...(item.variantId ? { variant: Number(item.variantId) } : {}),
                quantity: item.quantity,
                notes: item.notes ?? "",
              })),
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy_m: coords.accuracy,
              // GeolocationPosition.timestamp is milliseconds since epoch;
              // the backend validates Unix seconds and rejects stale fixes.
              location_timestamp: timestamp / 1000,
            }),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(apiErrorMessage(t, body, response.status, t.qrCart.errors, t.qrCart.genericError));
          }
          sessionStorage.setItem(`order-phone:${body.order_number}`, phone.trim());
          // The order page and pay page find this phone's own bill with it.
          setTablePhone(tableCode, phone.trim());
          pinBill(tableCode, body.bill_id);
          clearCart();
          router.push(`/t/${encodeURIComponent(tableCode)}/order/${encodeURIComponent(body.order_number)}${body.bill_id ? `?bill_id=${encodeURIComponent(body.bill_id)}` : ""}`);
        } catch (cause) {
          setError(cause instanceof TypeError ? networkErrorMessage(t) : cause instanceof Error ? cause.message : t.qrCart.couldNotPlace);
        } finally {
          setIsPending(false);
        }
      }, (cause) => {
        if (cause.code === cause.PERMISSION_DENIED) setError(t.qrCart.geoDenied);
        else if (cause.code === cause.POSITION_UNAVAILABLE) setError(t.qrCart.geoUnavailable);
        else setError(t.qrCart.geoTimeout);
        setIsPending(false);
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
  }

  if (!cartLoaded) return <p className="text-center font-body text-white/55">{t.qrCart.loading}</p>;

  if (!cartItems.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-brand-black-soft px-6 py-14 text-center">
        <p className="font-body text-white/55">{t.qrCart.empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div ref={listRef} className="space-y-3">
        {/* Two rows per line so nothing is squeezed on a phone: name + price
            + remove on top, quantity + note underneath. */}
        {cartItems.map((item) => (
          <article key={lineKey(item)} className={`qr-cart-row rounded-xl border bg-brand-black-soft p-3 ${limitFor(item) === 0 ? "border-brand-red/50" : "border-white/10"}`}>
            <div className="flex items-start gap-3">
              <CartThumb src={item.image} name={item.name} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-base tracking-wide text-white">{item.name}</h3>
                <p className="font-body text-[11px] text-white/50">
                  {item.variantName ? <span className="me-1.5 text-brand-gold">{item.variantName}</span> : null}
                  {t.common.each(money(item.price))}
                </p>
              </div>
              <strong className="flex-none whitespace-nowrap font-display text-base tracking-wide text-brand-gold">
                {money(item.price * item.quantity)}
              </strong>
              <button
                onClick={() => removeFromCart(lineKey(item))}
                aria-label={t.qrCart.remove(item.name)}
                className="-me-1 -mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-full font-body text-white/40 active:scale-90 hover:bg-white/5 hover:text-brand-red"
              >
                ✕
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex flex-none items-center rounded-full border border-white/15 bg-black/30">
                <button onClick={() => updateQuantity(lineKey(item), item.quantity - 1)} aria-label={t.cart.decrease(item.name)} className="flex h-9 w-9 items-center justify-center text-base text-white/80 active:scale-90 hover:text-brand-gold">−</button>
                <span className="w-7 text-center font-body text-sm font-semibold text-white">{item.quantity}</span>
                <button onClick={() => updateQuantity(lineKey(item), item.quantity + 1)} disabled={typeof limitFor(item) === "number" && item.quantity >= limitFor(item)} aria-label={t.cart.increase(item.name)} className="flex h-9 w-9 items-center justify-center text-base text-white/80 active:scale-90 hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100">+</button>
              </div>
              <label className="sr-only" htmlFor={`qr-notes-${lineKey(item)}`}>{t.qrCart.notesFor(item.name)}</label>
              {limitFor(item) === 0 ? (
                <span className="flex-none font-body text-[10px] font-semibold uppercase tracking-wide text-brand-red">{t.qrCart.soldOutRemove}</span>
              ) : typeof limitFor(item) === "number" && item.quantity >= limitFor(item) ? (
                <span className="flex-none font-body text-[10px] font-semibold uppercase tracking-wide text-brand-gold">{t.common.max(limitFor(item))}</span>
              ) : null}
              <input id={`qr-notes-${lineKey(item)}`} value={item.notes ?? ""} onChange={(event) => updateItemNotes(lineKey(item), event.target.value)} placeholder={t.qrCart.notePlaceholder} className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-3.5 py-2 font-body text-xs text-white placeholder:text-white/35 focus:border-brand-gold focus:outline-none" />
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-brand-black-soft p-4">
        <div className="flex items-center justify-between font-body text-sm">
          <span className="text-white/55">{t.common.total}</span>
          <strong className="font-display text-2xl tracking-wide text-brand-gold">{money(cartTotal)}</strong>
        </div>
        <p className="mt-1 font-body text-[11px] text-white/35">{t.qrCart.taxNote}</p>
      </div>

      {stockNotice && <p role="status" className="rounded-xl border border-brand-gold/30 bg-brand-black-soft p-3 font-body text-xs text-brand-gold">{stockNotice}</p>}
      {soldOutLines.length > 0 && (
        <p role="alert" className="rounded-xl border border-brand-red/40 bg-brand-red/10 p-3 font-body text-xs text-white/85">
          {t.qrCart.soldOut(soldOutLines.map((line) => line.name).join(t.common.listSep), soldOutLines.length)}
        </p>
      )}

      {sessionFailed && <p role="alert" className="text-sm text-brand-red">{t.qrCart.sessionCheckFailed}</p>}
      {access?.can_order === false && <p role="alert" className="text-sm text-brand-gold">{t.qrCart.errors["error.tableOccupied"]}</p>}
      <PhoneCaptureField value={phone} onChange={(value) => { setAccess(null); setSessionFailed(false); setPhone(value); }} error={error} readOnly={phoneLocked} />

      <button
        onClick={handleSubmit}
        disabled={isPending || accessBlocked || soldOutLines.length > 0}
        className="btn-primary w-full !rounded-xl !py-3.5 disabled:opacity-60"
      >
        {isPending ? t.qrCart.sending : error ? t.qrCart.retryOrder : t.qrCart.send}
      </button>
    </div>
  );
}

/** Product photo, or a plain initial tile when the image fails — never the alt text spilling over the row. */
function CartThumb({ src, name }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-lg bg-white/5">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true" className="font-display text-xl text-white/25">{name?.[0] ?? "•"}</span>
      )}
    </div>
  );
}
