"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useI18n } from "@/context/LocaleContext";

/*
  GalleryGrid.jsx
  -----------------------------------------------------------
  Photo grid with a full-screen viewer. Esc closes; the arrow
  keys and on-screen buttons step through every photo on the
  page. `photos` = [{ src, alt, unoptimized? }].
*/

export default function GalleryGrid({ sections }) {
  const { t, dir } = useI18n();
  const page = t.pages.gallery;
  const photos = sections.flatMap((section) => section.photos);
  const [openIndex, setOpenIndex] = useState(-1);

  const close = useCallback(() => setOpenIndex(-1), []);
  const step = useCallback((delta) => setOpenIndex((i) => (i + delta + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (openIndex < 0) return undefined;
    // In Arabic the "next" photo is to the left, so the arrow keys follow the reading direction.
    const forward = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
    const onKey = (event) => {
      if (event.key === "Escape") close();
      else if (event.key === forward) step(1);
      else if (event.key === back) step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, step, dir]);

  // Index of each section's first photo in the combined list the viewer steps through.
  const starts = sections.map((_, i) => sections.slice(0, i).reduce((sum, section) => sum + section.photos.length, 0));
  const active = photos[openIndex];

  return (
    <>
      {sections.map((section, sectionIndex) => {
        const start = starts[sectionIndex];
        if (!section.photos.length) return null;
        return (
          <section key={section.title} className="mb-14">
            <h2 className="font-display text-3xl tracking-wide text-white md:text-4xl">{section.title}</h2>
            <span className="heading-underline !mx-0" />
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {section.photos.map((photo, i) => (
                <button
                  key={`${photo.src}-${i}`}
                  type="button"
                  onClick={() => setOpenIndex(start + i)}
                  aria-label={page.open(photo.alt)}
                  className={`group relative overflow-hidden rounded-xl border border-white/10 ${section.wide ? "aspect-video md:col-span-2" : "aspect-square"}`}
                >
                  <Image src={photo.src} alt={photo.alt} fill unoptimized={photo.unoptimized} sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-start font-body text-xs text-white/90 opacity-0 transition-opacity group-hover:opacity-100">{photo.alt}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {active ? (
        <div role="dialog" aria-modal="true" aria-label={active.alt} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={close}>
          <div className="relative h-[80vh] w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <Image src={active.src} alt={active.alt} fill unoptimized={active.unoptimized} sizes="100vw" className="object-contain" />
            <p className="absolute inset-x-0 -bottom-8 text-center font-body text-sm text-white/75">{active.alt}</p>
          </div>
          <button type="button" onClick={close} aria-label={page.close} className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-xl text-white hover:border-brand-red">✕</button>
          {photos.length > 1 ? (
            <>
              <button type="button" onClick={(event) => { event.stopPropagation(); step(-1); }} aria-label={page.previous} className={`${NAV} start-4`}>{t.common.arrowBack}</button>
              <button type="button" onClick={(event) => { event.stopPropagation(); step(1); }} aria-label={page.next} className={`${NAV} end-4`}>{t.common.arrowForward}</button>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

const NAV = "absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50 text-xl text-white hover:border-brand-red hover:text-brand-red";
