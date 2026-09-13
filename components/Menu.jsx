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
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCart } from "./CartContext";
import { MENU_ITEMS } from "./menuData";

gsap.registerPlugin(ScrollTrigger);

// Category tabs shown above the grid.
const CATEGORIES = ["All", "Burgers", "Pizza", "Sides", "Drinks"];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("All");
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const isFirstRender = useRef(true);

  const filteredItems =
    activeCategory === "All" ? MENU_ITEMS : MENU_ITEMS.filter((item) => item.category === activeCategory);

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
    <section id="menu" ref={sectionRef} className="relative bg-brand-black px-6 pb-8 pt-16 md:px-10 md:pb-10 md:pt-20">
      {/* Section heading */}
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-5xl tracking-wide text-white md:text-6xl">OUR MENU</h2>
        <span className="heading-underline" />
        <p className="mt-5 font-body text-white/60">
          Every item made fresh to order, from premium ingredients, with zero shortcuts.
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`rounded-full border px-6 py-2 font-body text-sm font-medium uppercase tracking-wide transition-all duration-300 ${
              activeCategory === category
                ? "border-brand-red bg-brand-red text-white"
                : "border-white/15 text-white/70 hover:border-brand-red hover:text-white"
            }`}
          >
            {category}
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
  const { addToCart } = useCart();
  const [wasAdded, setWasAdded] = useState(false);

  function handleAddToCart() {
    addToCart(item);
    setWasAdded(true);
    window.setTimeout(() => setWasAdded(false), 1100);
  }

  return (
    <div className="menu-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-brand-black-soft transition-all duration-300 hover:-translate-y-2 hover:border-brand-red/70 hover:shadow-[0_0_35px_rgba(224,32,42,0.25)]">
      {/* Image */}
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {item.badge && (
          <span className="absolute right-3 top-3 rounded-full bg-brand-gold px-3 py-1 font-body text-xs font-bold uppercase tracking-wide text-brand-black">
            {item.badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-2xl tracking-wide text-white">{item.name}</h3>
        <p className="flex-1 font-body text-sm leading-relaxed text-white/60">{item.description}</p>

        <div className="mt-2 flex items-center justify-between">
          <span className="font-display text-2xl tracking-wide text-brand-gold">{item.price}</span>
          <button onClick={handleAddToCart} className={`btn-outline !py-2 !px-5 !text-xs ${wasAdded ? "!border-brand-gold !bg-brand-gold !text-brand-black" : ""}`}>
            {wasAdded ? "Added ✓" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
