"use client";

/*
  Menu.jsx
  -----------------------------------------------------------
  The "OUR MENU" section: category filter tabs + a responsive
  grid of product cards.

  Two separate animations are used here:
  1. On first load, GSAP ScrollTrigger fades/slides the cards in
     with a stagger as the section scrolls into view.
  2. When a filter tab is clicked, a quick fade+scale transition
     plays on the whole grid so the swap doesn't feel abrupt.
*/

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCart, lineKey } from "@/context/CartContext";
import { useI18n } from "@/context/LocaleContext";

gsap.registerPlugin(ScrollTrigger);

// items/categories come from a Server Component that fetched them via lib/api —
// see app/page.js. Menu never imports mock data directly.
// `standalone` is the full /menu page, which has its own page header, so the
// section drops its own heading there.
export default function Menu({ items, categories, standalone = false }) {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState("All");
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const isFirstRender = useRef(true);

  const categoryTabs = ["All", ...categories.map((category) => category.name)];
  const filteredItems =
    activeCategory === "All" ? items : items.filter((item) => item.categoryName === activeCategory);

  // Animation A: reveal the cards with a staggered fade/slide-up as the
  // section scrolls into view. Runs once, on mount.
  useEffect(() => {
    const cards = gsap.utils.toArray(".menu-card", gridRef.current);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animation B: whenever the active filter changes, fade+scale the grid
  // out/in so swapping categories feels smooth instead of an instant jump.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    gsap.fromTo(gridRef.current, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" });
  }, [activeCategory]);

  function handleCategoryClick(category) {
    if (category === activeCategory) return;
    // Fade the current grid out, then swap the data once it's invisible.
    gsap.to(gridRef.current, {
      opacity: 0,
      scale: 0.97,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => setActiveCategory(category),
    });
  }

  return (
    <section id="menu" ref={sectionRef} className={`relative bg-brand-black px-6 pb-8 md:px-10 md:pb-10 ${standalone ? "pt-4" : "pt-16 md:pt-20"}`}>
      {/* Section heading */}
      {!standalone && (
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-5xl tracking-wide text-white md:text-6xl">{t.menu.heading}</h2>
          <span className="heading-underline" />
          <p className="mt-5 font-body text-white/60">{t.menu.intro}</p>
        </div>
      )}
      {items.length === 0 && (
        <p className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-brand-black-soft p-6 text-center font-body text-white/60">{t.menu.empty}</p>
      )}

      {/* Category filter tabs */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {categoryTabs.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`rounded-full border px-6 py-2 font-body text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
              activeCategory === category
                ? "border-brand-red bg-brand-red text-white"
                : "border-white/15 text-white/70 hover:border-brand-red hover:text-white"
            }`}
          >
            {category === "All" ? t.common.all : category}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div
        ref={gridRef}
        className="mx-auto mt-9 grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {filteredItems.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function MenuCard({ item }) {
  const { t, money } = useI18n();
  const { addToCart, cartItems } = useCart();
  const [wasAdded, setWasAdded] = useState(false);
  // Same stock rules as the QR menu: sold out at 0, capped at what's left.
  const maxQuantity = item.availableQuantity;
  const inCart = cartItems.find((line) => lineKey(line) === String(item.id))?.quantity ?? 0;
  const soldOut = !item.isOrderable || maxQuantity === 0;
  const atLimit = typeof maxQuantity === "number" && inCart >= maxQuantity;

  function handleAddToCart() {
    if (item.variants?.length || soldOut || atLimit) return;
    addToCart({ ...item, maxQuantity });
    setWasAdded(true);
    window.setTimeout(() => setWasAdded(false), 1100);
  }

  return (
    <div className="menu-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-black-soft transition-all duration-300 hover:-translate-y-2 hover:border-brand-red/70 hover:shadow-[0_0_35px_rgba(224,32,42,0.25)]">
      {/* Image */}
      <Link href={`/menu/${item.id}`} className="relative block h-56 w-full overflow-hidden" aria-label={t.menu.viewItem(item.name)}>
        <Image
          src={item.image}
          alt={item.name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {item.badge && (
          <span className="absolute end-3 top-3 rounded-full bg-brand-gold px-3 py-1 font-body text-xs font-bold uppercase tracking-wide text-brand-black">
            {t.common.badges[item.badge] ?? item.badge}
          </span>
        )}
        {soldOut && <span className="absolute bottom-3 start-3 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold uppercase text-white">{t.common.unavailable}</span>}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Link href={`/menu/${item.id}`} className="font-display text-2xl tracking-wide text-white transition-colors hover:text-brand-gold">
          <h3>{item.name}</h3>
        </Link>
        <p className="flex-1 font-body text-sm leading-relaxed text-white/60">{item.description}</p>

        <div className="mt-2 flex items-center justify-between">
          <span className="flex items-baseline gap-2">
            {item.onDeal && item.originalPrice != null && (
              <span className="font-body text-sm text-white/40 line-through">{money(item.originalPrice)}</span>
            )}
            <span className="font-display text-2xl tracking-wide text-brand-gold">{money(item.price)}</span>
          </span>
          {item.variants?.length ? <Link href={`/menu/${item.id}`} className="btn-outline !py-2 !px-5 !text-xs">{t.common.chooseOption}</Link> : <button onClick={handleAddToCart} disabled={soldOut || atLimit} title={atLimit ? t.common.onlyAvailable(maxQuantity) : undefined} className={`btn-outline !py-2 !px-5 !text-xs disabled:opacity-50 ${wasAdded ? "!border-brand-gold !bg-brand-gold !text-brand-black" : ""}`}>
            {soldOut ? t.common.notAvailable : atLimit ? t.common.max(maxQuantity) : wasAdded ? t.common.added : t.common.addToCart}
          </button>}
        </div>
      </div>
    </div>
  );
}
