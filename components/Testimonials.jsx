"use client";

/*
  Testimonials.jsx
  -----------------------------------------------------------
  Horizontally scrollable row of compact review cards, fed by
  live Google Maps reviews (see lib/api/reviews.ts). Arrow
  buttons scroll the row by one card at a time. Renders
  nothing when no reviews could be loaded.
*/

import { useRef } from "react";
import Link from "next/link";
import { RESTAURANT_CONTACT } from "@/lib/constants";
import { useI18n } from "@/context/LocaleContext";
import { reviewDate, reviewText } from "@/lib/reviewDisplay";
import ReviewSourceTag, { ReviewAuthor } from "@/components/ReviewSourceTag";

export default function Testimonials({ data }) {
  const { t, locale } = useI18n();
  const scrollRef = useRef(null);
  const reviews = data?.reviews ?? [];
  if (reviews.length === 0) return null;

  const placeUrl = data.placeUrl || RESTAURANT_CONTACT.mapsUrl;

  function scrollByCard(direction) {
    const container = scrollRef.current;
    if (!container) return;
    const cardWidth = container.firstChild?.offsetWidth ?? 280;
    container.scrollBy({ left: direction * (cardWidth + 16), behavior: "smooth" });
  }

  return (
    <section className="relative bg-brand-black py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-end md:justify-between md:text-start">
          <div>
            <h2 className="font-display text-3xl tracking-wide text-white md:text-4xl">{t.testimonials.heading}</h2>
            <span className="heading-underline md:!mx-0" />
            {data.rating ? (
              <a href={placeUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-body text-sm text-white/60 hover:text-brand-gold">
                <span className="font-semibold text-brand-gold">{data.rating.toFixed(1)} ★</span>
                {data.totalCount ? <span>{t.testimonials.reviewsOnGoogle(data.totalCount)}</span> : <span>{t.testimonials.onGoogle}</span>}
              </a>
            ) : null}
          </div>

          {/* Arrow controls: each arrow scrolls the way it points, in both directions of text */}
          <div className="flex items-center gap-2" dir="ltr">
            <Link href="/reviews" dir={locale === "ar" ? "rtl" : "ltr"} className="mr-2 font-body text-xs font-semibold uppercase tracking-wide text-white/60 hover:text-brand-gold">{t.testimonials.seeAll}</Link>
            <button aria-label={t.testimonials.scrollLeft} onClick={() => scrollByCard(-1)} className={ARROW_CLASS}>←</button>
            <button aria-label={t.testimonials.scrollRight} onClick={() => scrollByCard(1)} className={ARROW_CLASS}>→</button>
          </div>
        </div>

        {/* Horizontally scrolling card row */}
        <div
          ref={scrollRef}
          className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((review) => (
            <article
              key={review.id}
              className="flex w-[80%] flex-shrink-0 snap-start flex-col rounded-xl border border-white/10 bg-brand-black-soft p-4 transition-colors duration-300 hover:border-brand-red/70 sm:w-[48%] md:w-[32%] lg:w-[24%]"
            >
              <div className="flex items-center gap-3">
                {review.authorPhotoUrl ? (
                  <img src={review.authorPhotoUrl} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red font-body text-sm font-semibold text-white">
                    {review.authorName.charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <ReviewAuthor review={review} placeUrl={placeUrl} className="block truncate font-body text-sm font-semibold text-white" />
                  <p className="font-body text-xs text-white/40">{reviewDate(review, locale)}</p>
                </div>
              </div>

              <div className="mt-2 flex gap-0.5 text-sm text-brand-gold" aria-label={t.testimonials.starsAria(review.rating)}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < review.rating ? "opacity-100" : "opacity-25"}>★</span>
                ))}
              </div>

              {review.text ? (
                <p dir="auto" className="mt-2 line-clamp-4 font-body text-sm leading-snug text-white/70">{reviewText(review, locale)}</p>
              ) : null}

              <div className="mt-auto pt-3">
                <ReviewSourceTag review={review} labels={t.testimonials} placeUrl={placeUrl} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const ARROW_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white transition-colors duration-300 hover:border-brand-red hover:text-brand-red";
