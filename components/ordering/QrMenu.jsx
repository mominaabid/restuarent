"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useCart } from "@/context/CartContext";
import { useTableSession } from "@/context/TableSessionContext";
import { useI18n } from "@/context/LocaleContext";

/** Remembers the category and scroll position so Back lands where you were. */
const stateKey = (tableCode) => `qr-menu-state:${tableCode}`;

function readState(tableCode) {
  try {
    return JSON.parse(window.sessionStorage.getItem(stateKey(tableCode)) || "null");
  } catch {
    return null;
  }
}

function writeState(tableCode, value) {
  try {
    window.sessionStorage.setItem(stateKey(tableCode), JSON.stringify(value));
  } catch {
    // Storage blocked — Back simply starts at the top.
  }
}

// useLayoutEffect on the client (restore before paint), useEffect on the server.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// items are already filtered to isAvailable-only by lib/api/products.getAvailableProducts
// — see app/t/[tableCode]/menu/page.jsx.
export default function QrMenu({ items, categories }) {
  const { tableCode } = useTableSession();
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState("All");
  const gridRef = useRef(null);
  const restored = useRef(false);
  const categoryTabs = ["All", ...categories.map((category) => category.name)];
  const filteredItems =
    activeCategory === "All" ? items : items.filter((item) => item.categoryName === activeCategory);

  // Back from the cart / order page: same category, same scroll position.
  useIsoLayoutEffect(() => {
    const saved = readState(tableCode);
    if (saved?.category && categoryTabs.includes(saved.category)) setActiveCategory(saved.category);
    restored.current = true;
    if (saved?.scrollY) window.requestAnimationFrame(() => window.scrollTo(0, saved.scrollY));
    // Restore once on arrival.
  }, [tableCode]);

  useEffect(() => {
    let timer;
    const save = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => writeState(tableCode, { category: activeCategory, scrollY: window.scrollY }), 120);
    };
    save();
    window.addEventListener("scroll", save, { passive: true });
    return () => {
      window.removeEventListener("scroll", save);
      window.clearTimeout(timer);
      writeState(tableCode, { category: activeCategory, scrollY: window.scrollY });
    };
  }, [tableCode, activeCategory]);

  // A quick fade on category change — short enough that items never feel late.
  useEffect(() => {
    if (!restored.current) return undefined;
    const cards = gsap.utils.toArray(".qr-menu-card", gridRef.current);
    const ctx = gsap.context(() => {
      gsap.fromTo(cards, { opacity: 0.3, y: 6 }, { opacity: 1, y: 0, duration: 0.18, ease: "power1.out", stagger: 0.015 });
    }, gridRef);
    return () => ctx.revert();
  }, [activeCategory]);

  return (
    <div>
      {/* One swipeable row that stays under the navbar while scrolling. */}
      {/* top = the fixed navbar's height (h-12 logo + py-4; h-14 from md). */}
      <div className="sticky top-20 z-20 -mx-5 bg-brand-black/95 px-5 py-2 backdrop-blur-sm md:top-[5.5rem] md:-mx-8 md:px-8">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {categoryTabs.map((category) => (
            <button
              key={category}
              onClick={() => { setActiveCategory(category); window.scrollTo({ top: 0 }); }}
              className={`flex-none whitespace-nowrap rounded-full border px-3.5 py-2 font-body text-[11px] font-semibold uppercase tracking-wide transition-colors active:scale-95 sm:text-xs ${
                activeCategory === category
                  ? "border-brand-red bg-brand-red text-white"
                  : "border-white/15 text-white/70 hover:border-brand-red hover:text-white"
              }`}
            >
              {category === "All" ? t.common.all : category}
            </button>
          ))}
        </div>
      </div>

      <div ref={gridRef} className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        {filteredItems.map((item) => (
          <QrMenuCard key={item.id} item={item} />
        ))}
      </div>
      {!filteredItems.length ? <p className="mt-6 rounded-xl border border-white/10 p-5 text-center font-body text-sm text-white/55">{t.qrMenu.empty}</p> : null}
    </div>
  );
}

function QrMenuCard({ item }) {
  const { t, money } = useI18n();
  const { addToCart, cartItems } = useCart();
  const [addedCount, setAddedCount] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const resetTimer = useRef(0);
  const variants = item.variants ?? [];
  // Preselect the first portion so "Add" always works in one tap. Products
  // with no variants are unaffected and behave exactly as before.
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");

  const selectedVariant = variants.find((variant) => String(variant.id) === String(variantId));
  // The displayed price follows the selected portion. Both come from the
  // server (deal pricing already resolved), so nothing is computed here.
  const unitPrice = selectedVariant ? selectedVariant.price : item.price;
  const lineId = selectedVariant ? `${item.id}:${selectedVariant.id}` : String(item.id);
  const maxQuantity = selectedVariant ? selectedVariant.availableQuantity : item.availableQuantity;
  const inCart = cartItems.find((line) => (line.cartItemId ?? String(line.id)) === lineId)?.quantity ?? 0;
  const atLimit = typeof maxQuantity === "number" && inCart >= maxQuantity;
  const orderable = item.isOrderable && selectedVariant?.isOrderable !== false && maxQuantity !== 0;

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  function handleAddToCart() {
    if (!orderable || atLimit) return;
    addToCart({
      ...item,
      // Two portions of one dish are two cart lines, so the line key must
      // include the variant — otherwise adding 1 KG would increment Half KG.
      cartItemId: selectedVariant ? `${item.id}:${selectedVariant.id}` : String(item.id),
      price: unitPrice,
      variantId: selectedVariant ? String(selectedVariant.id) : undefined,
      variantName: selectedVariant ? selectedVariant.name : undefined,
      maxQuantity,
    });
    // Instant feedback: a tiny buzz, and the button shows how many were added.
    try { navigator.vibrate?.(15); } catch { /* not supported */ }
    setAddedCount((count) => count + 1);
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setAddedCount(0), 1200);
  }

  return (
    <article className="qr-menu-card flex gap-3 rounded-xl border border-white/10 bg-brand-black-soft p-2.5 sm:p-3">
      <div className="flex h-[4.5rem] w-[4.5rem] flex-none items-center justify-center overflow-hidden rounded-lg bg-white/5 sm:h-20 sm:w-20">
        {item.image && !imageFailed ? (
          <img src={item.image} alt="" loading="lazy" onError={() => setImageFailed(true)} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true" className="font-display text-2xl text-white/25">{item.name?.[0] ?? "•"}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="truncate font-display text-base tracking-wide text-white sm:text-lg">{item.name}</h3>
        <p className="line-clamp-2 flex-1 font-body text-[11px] leading-relaxed text-white/55 sm:text-xs">{item.description}</p>
        {variants.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {variants.map((variant) => {
              const isSelected = String(variant.id) === String(variantId);
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(String(variant.id))}
                  disabled={variant.isOrderable === false}
                  aria-pressed={isSelected}
                  className={`rounded-full border px-2.5 py-1 font-body text-[11px] font-semibold transition-colors active:scale-95 disabled:opacity-40 ${
                    isSelected
                      ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
                      : "border-white/15 text-white/60 hover:border-brand-gold/60 hover:text-white"
                  }`}
                >
                  {variant.name}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-baseline gap-1.5">
            {item.onDeal && item.originalPrice != null && !selectedVariant && (
              <span className="font-body text-[11px] text-white/40 line-through">{money(item.originalPrice)}</span>
            )}
            <span className="whitespace-nowrap font-display text-base tracking-wide text-brand-gold sm:text-lg">{money(unitPrice)}</span>
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!orderable || atLimit}
            title={atLimit ? t.common.onlyAvailable(maxQuantity) : undefined}
            className={`min-w-[4.5rem] flex-none rounded-full border px-4 py-2 font-body text-xs font-bold uppercase tracking-wide transition-all duration-100 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
              addedCount
                ? "border-brand-gold bg-brand-gold text-brand-black"
                : "border-brand-red bg-brand-red/10 text-white hover:bg-brand-red"
            }`}
          >
            {!orderable ? t.qrMenu.soldOut : atLimit ? t.common.max(maxQuantity) : addedCount ? `+${addedCount} ✓` : t.qrMenu.add}
          </button>
        </div>
      </div>
    </article>
  );
}
