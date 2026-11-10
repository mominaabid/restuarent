"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { RESTAURANT_CONTACT } from "@/lib/constants";
import { useI18n } from "@/context/LocaleContext";

/*
  Hero.jsx
  -----------------------------------------------------------
  Full-screen banner: a crossfading slider of banner images
  behind the restaurant name, tagline, CTAs, opening hours and
  address. Slides advance on a timer; arrows and dots switch
  manually and restart the timer.
*/

// Edit this array to add, remove or reorder banner slides. Alt text for each
// slide lives in the dictionaries (hero.slides), in the same order.
const SLIDES = [
  { src: "/hero/farzan-hero.png" },
  { src: "/hero/farzan-hero-2.png" },
];

const SLIDE_INTERVAL_MS = 6000;

export default function Hero() {
  const [active, setActive] = useState(0);
  const { t } = useI18n();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % SLIDES.length), SLIDE_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [active]);

  const go = (step) => setActive((i) => (i + step + SLIDES.length) % SLIDES.length);

  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden bg-brand-black">
      {SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={t.hero.slides[i]}
          fill
          priority={i === 0}
          sizes="100vw"
          aria-hidden={i !== active}
          className={`object-cover object-left transition-opacity duration-1000 md:object-center ${i === active ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-32 md:px-10">
        {/* In Arabic the block stays over the dark left side of the photo (mr-auto pushes it left in RTL). */}
        <div className="max-w-xl rtl:mr-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
            {t.hero.tagline}
          </span>

          <p
            lang={t.brand.altLang}
            dir={t.brand.altLang === "ar" ? "rtl" : "ltr"}
            className={`mt-6 font-extrabold leading-tight text-brand-red ${t.brand.altLang === "ar" ? "text-5xl sm:text-6xl md:text-7xl" : "font-[family-name:var(--font-poppins)] text-3xl sm:text-4xl md:text-5xl"}`}
          >
            {t.brand.altName}
          </p>
          <h1 className="mt-2 font-body text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            {t.brand.short}
          </h1>

          <p className="mt-5 max-w-md font-body text-base leading-relaxed text-white/80 md:text-lg">
            {t.hero.intro}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#menu" className="btn-primary !rounded-full !px-6 !py-3 !text-base">
              {t.common.viewMenu} {t.common.arrowForward}
            </a>
            <a
              href={RESTAURANT_CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 font-body text-sm font-semibold text-white transition-colors hover:border-brand-gold hover:text-brand-gold"
            >
              <PinIcon /> {t.common.getDirections}
            </a>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-5 font-body text-sm text-white/75 sm:flex-row sm:gap-8">
            <span className="flex items-center gap-2">
              <ClockIcon /> <span>{t.contact.openDaily} · {t.contact.hours}</span>
            </span>
            <span className="flex items-center gap-2">
              <PinIcon /> <span>{t.contact.address}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Slider controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 md:right-10" dir="ltr">
        <button type="button" aria-label={t.hero.previous} onClick={() => go(-1)} className={ARROW_CLASS}>←</button>
        <div className="flex gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={t.hero.showSlide(i + 1)}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all ${i === active ? "w-8 bg-brand-red" : "w-2 bg-white/50 hover:bg-white"}`}
            />
          ))}
        </div>
        <button type="button" aria-label={t.hero.next} onClick={() => go(1)} className={ARROW_CLASS}>→</button>
      </div>
    </section>
  );
}

const ARROW_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition-colors hover:border-brand-red hover:text-brand-red";

function ClockIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

function PinIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="shrink-0"><path d="M12 21s7-6.1 7-11.5a7 7 0 1 0-14 0C5 14.9 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
}
