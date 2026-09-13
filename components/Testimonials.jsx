"use client";

/*
  Testimonials.jsx
  -----------------------------------------------------------
  Horizontally scrollable row of customer review cards, with
  arrow buttons that scroll the row by one card at a time.
  Star ratings use the gold accent color.
*/

import { useRef } from "react";

// -----------------------------------------------------------
// PLACEHOLDER REVIEWS — edit this array to change testimonials.
// -----------------------------------------------------------
const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Malik",
    role: "Regular Customer",
    rating: 5,
    quote:
      "Hands down the best burger I've had in this city. The patty is always juicy and the bun is perfectly toasted every single time.",
  },
  {
    id: 2,
    name: "Ahmed Raza",
    role: "Food Blogger",
    rating: 5,
    quote:
      "The attention to detail here is unreal — from the sauce to the sear on the patty. This is what a premium burger should taste like.",
  },
  {
    id: 3,
    name: "Layla Hassan",
    role: "First-time Visitor",
    rating: 4,
    quote:
      "Walked in for the ambiance, stayed for the food. The double bacon deluxe completely blew me away. Coming back for sure.",
  },
  {
    id: 4,
    name: "Omar Farooq",
    role: "Regular Customer",
    rating: 5,
    quote:
      "Consistent quality every visit. You can tell they actually care about the ingredients instead of just the speed of service.",
  },
];

export default function Testimonials() {
  const scrollRef = useRef(null);

  function scrollByCard(direction) {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.firstChild?.offsetWidth ?? 320;
    container.scrollBy({ left: direction * (cardWidth + 24), behavior: "smooth" });
  }

  return (
    <section className="relative bg-brand-black py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-4xl tracking-wide text-white md:text-5xl">WHAT PEOPLE SAY</h2>
            <span className="heading-underline md:!mx-0" />
          </div>

          {/* Arrow controls */}
          <div className="flex gap-3">
            <button
              aria-label="Scroll left"
              onClick={() => scrollByCard(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-300 hover:scale-110 hover:border-brand-red hover:text-brand-red"
            >
              ←
            </button>
            <button
              aria-label="Scroll right"
              onClick={() => scrollByCard(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-all duration-300 hover:scale-110 hover:border-brand-red hover:text-brand-red"
            >
              →
            </button>
          </div>
        </div>

        {/* Horizontally scrolling card row */}
        <div
          ref={scrollRef}
          className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((review) => (
            <div
              key={review.id}
              className="w-[85%] flex-shrink-0 snap-start rounded-2xl border border-white/10 bg-brand-black-soft p-8 transition-all duration-300 hover:border-brand-red/70 hover:shadow-[0_0_35px_rgba(224,32,42,0.2)] sm:w-[60%] md:w-[45%] lg:w-[30%]"
            >
              {/* Star rating */}
              <div className="flex gap-1 text-brand-gold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < review.rating ? "opacity-100" : "opacity-25"}>
                    ★
                  </span>
                ))}
              </div>

              <p className="mt-5 font-body text-sm leading-relaxed text-white/70">&ldquo;{review.quote}&rdquo;</p>

              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="font-display text-lg tracking-wide text-white">{review.name}</p>
                <p className="font-body text-xs uppercase tracking-wide text-white/40">{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
