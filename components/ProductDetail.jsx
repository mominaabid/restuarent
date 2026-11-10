"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useCart, lineKey } from "@/context/CartContext";
import { useI18n } from "@/context/LocaleContext";

// product/relatedProducts come from a Server Component that fetched them via
// lib/api — see app/menu/[id]/page.jsx. Never imports mock data directly.
export default function ProductDetail({ product, relatedProducts = [], rating, reviewCount }) {
  const { t, money } = useI18n();
  const { addToCart, cartItems } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [wasAdded, setWasAdded] = useState(false);
  const pageRef = useRef(null);

  useEffect(() => {
    if (!product) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo(
        ".detail-reveal",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.12 }
      );
      gsap.fromTo(
        ".detail-main-image",
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }
      );
    }, pageRef);
    return () => context.revert();
  }, [product]);

  const variants = product?.variants ?? [];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const unitPrice = selectedVariant?.price ?? product?.price ?? 0;
  // Same stock rules as the QR menu: sold out at 0, and never more than what's
  // left once the cart's existing quantity for this line is counted.
  const lineId = selectedVariant ? `${product?.id}:${selectedVariant.id}` : String(product?.id);
  const maxQuantity = selectedVariant ? selectedVariant.availableQuantity : product?.availableQuantity;
  const inCart = cartItems.find((line) => lineKey(line) === lineId)?.quantity ?? 0;
  const remaining = typeof maxQuantity === "number" ? Math.max(0, maxQuantity - inCart) : undefined;
  const soldOut = !product?.isOrderable || selectedVariant?.isOrderable === false || maxQuantity === 0;
  const atLimit = !soldOut && remaining === 0;

  // Keep the picker inside what can still be added (e.g. after switching portion).
  const pickedQuantity = typeof remaining === "number" && remaining > 0 ? Math.min(quantity, remaining) : quantity;
  const totalPrice = unitPrice * pickedQuantity;

  function handleAddToCart() {
    if (!product || soldOut || atLimit) return;
    addToCart({
      maxQuantity,
      ...product,
      id: product.id,
      productId: product.id,
      cartItemId: selectedVariant ? `${product.id}:${selectedVariant.id}` : product.id,
      price: unitPrice,
      quantity: pickedQuantity,
      ...(selectedVariant ? { variantId: selectedVariant.id, variantName: selectedVariant.name } : {}),
    });
    setWasAdded(true);
    window.setTimeout(() => setWasAdded(false), 1500);
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-black px-6 text-center">
        <div>
          <h1 className="font-display text-5xl text-white">{t.product.notFound}</h1>
          <Link href="/menu" className="btn-primary mt-6 inline-block">{t.product.backToMenu}</Link>
        </div>
      </main>
    );
  }

  const gallery = [product.image, product.image, product.image];
  const activeImage = selectedImage || product.image;

  return (
    <main ref={pageRef} className="min-h-screen bg-brand-black px-5 pb-20 pt-28 md:px-10 md:pt-36">
      <div className="mx-auto max-w-7xl">
        <nav className="detail-reveal mb-8 flex flex-wrap items-center gap-2 font-body text-xs uppercase tracking-[0.18em] text-white/45" aria-label={t.nav.breadcrumb}>
          <Link href="/" className="transition-colors hover:text-brand-gold">{t.nav.home}</Link>
          <span>/</span>
          <Link href="/menu" className="transition-colors hover:text-brand-gold">{t.nav.menu}</Link>
          <span>/</span>
          <span className="text-brand-gold">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:gap-16">
          <section className="detail-reveal">
            <div className="relative">
              <div className="red-glow absolute -inset-8 opacity-60" />
              <div className="detail-main-image relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-brand-black-soft shadow-[0_20px_70px_rgba(224,32,42,0.2)]">
                <Image src={activeImage} alt={product.name} fill priority unoptimized sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition-colors ${activeImage === image && index === 0 ? "border-brand-red" : "border-white/10 hover:border-brand-gold/60"}`}
                  aria-label={t.product.viewImage(index + 1)}
                >
                  <Image src={image} alt="" fill unoptimized sizes="180px" className="object-cover" />
                </button>
              ))}
            </div>
          </section>

          <section className="detail-reveal">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">{product.categoryName}</p>
            <h1 className="mt-2 font-display text-5xl leading-none tracking-wide text-white md:text-7xl">{product.name}</h1>
            <p className="mt-5 max-w-xl font-body leading-relaxed text-white/60">{product.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-5">
              <span className="flex items-baseline gap-2">
                {(selectedVariant?.onDeal ? selectedVariant.originalPrice : !selectedVariant && product.originalPrice) != null && (
                  <span className="font-body text-lg text-white/40 line-through">{money(selectedVariant?.onDeal ? selectedVariant.originalPrice : product.originalPrice)}</span>
                )}
                <strong className="font-display text-4xl tracking-wide text-brand-gold">{money(unitPrice)}</strong>
              </span>
              {(selectedVariant?.onDeal || (!selectedVariant && product.onDeal)) && (
                <span className="rounded-full bg-brand-gold px-3 py-1 font-body text-xs font-bold uppercase tracking-wide text-brand-black">
                  {t.common.badges.Deal}
                </span>
              )}
              {rating && reviewCount ? (
                <Link href="/reviews" className="font-body text-sm text-brand-gold hover:underline">
                  ★ <span className="ms-1 text-white/50">{t.product.googleRating(rating.toFixed(1), reviewCount)}</span>
                </Link>
              ) : null}
            </div>

            <div className="mt-8 space-y-7 rounded-2xl border border-white/10 bg-brand-black-soft/60 p-5 md:p-7">
              {variants.length > 0 && <OptionGroup label={t.product.chooseOption}>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <button key={variant.id} type="button" disabled={variant.isOrderable === false} onClick={() => setSelectedVariantId(variant.id)} className={`rounded-full border px-4 py-2 font-body text-sm transition-all disabled:opacity-40 ${(!selectedVariantId ? variant === variants[0] : selectedVariantId === variant.id) ? "border-brand-red bg-brand-red text-white" : "border-white/15 text-white/65 hover:border-brand-red"}`}>
                      {variant.name} · {money(variant.price)}{variant.isOrderable === false ? ` · ${t.common.unavailable}` : ""}
                    </button>
                  ))}
                </div>
              </OptionGroup>}

              <div className="flex items-center justify-between border-t border-white/10 pt-6">
                <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-white/55">{t.product.quantity}</span>
                <div className="flex items-center rounded-full border border-white/15 bg-black/30">
                  <button type="button" onClick={() => setQuantity(Math.max(1, pickedQuantity - 1))} aria-label={t.product.decrease} className="h-10 w-10 text-xl text-white/70 transition-colors hover:text-brand-gold">-</button>
                  <span className="w-8 text-center font-body font-semibold text-white">{pickedQuantity}</span>
                  <button type="button" onClick={() => setQuantity(pickedQuantity + 1)} disabled={typeof remaining === "number" && pickedQuantity >= remaining} aria-label={t.product.increase} className="h-10 w-10 text-xl text-white/70 transition-colors hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-30">+</button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-y border-white/10 py-5">
              <span className="font-body text-xs font-semibold uppercase tracking-[0.22em] text-white/55">{t.product.liveTotal}</span>
              <strong className="font-display text-5xl tracking-wide text-brand-gold">{money(totalPrice)}</strong>
            </div>
            <div className="sticky bottom-0 z-10 -mx-5 mt-5 bg-brand-black/95 px-5 py-3 backdrop-blur-sm md:static md:mx-0 md:bg-transparent md:px-0 md:py-0">
              <button type="button" onClick={handleAddToCart} disabled={soldOut || atLimit} className={`btn-primary w-full !rounded-xl !py-4 text-lg disabled:opacity-50 ${wasAdded ? "!bg-brand-gold !text-brand-black !shadow-[0_0_35px_rgba(245,184,0,0.35)]" : ""}`}>
                {soldOut ? t.product.unavailableNow : atLimit ? t.product.maxInCart(maxQuantity) : wasAdded ? t.product.addedToCart : t.common.addToCart}
              </button>
            </div>
          </section>
        </div>

        <section className="detail-reveal mt-16 border-t border-white/10 pt-10 md:mt-24">
          <p className="font-body text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">{t.product.moreKicker}</p>
          <h2 className="mt-2 font-display text-4xl tracking-wide text-white md:text-5xl">{t.product.youMightLike}</h2>
          <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <Link key={item.id} href={`/menu/${item.id}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-brand-black-soft transition-all hover:-translate-y-1 hover:border-brand-red/70 hover:shadow-[0_0_25px_rgba(224,32,42,0.18)]">
                <div className="relative aspect-[4/3] overflow-hidden"><Image src={item.image} alt={item.name} fill unoptimized sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                <div className="p-4"><h3 className="font-display text-xl tracking-wide text-white">{item.name}</h3><p className="mt-1 font-body text-sm text-brand-gold">{money(item.price)}</p></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function OptionGroup({ label, children }) {
  return <div><h2 className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.22em] text-white/55">{label}</h2>{children}</div>;
}
